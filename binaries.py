import os, io, stat, shutil
import json
import requests, zipfile, tarfile

# paths
localpath = os.path.dirname(os.path.realpath(__file__))
temp_path = localpath + '/.temp'
windows_path = localpath + '/thirdparty/windows'
linux_path = localpath + '/thirdparty/linux'
macos_path = localpath + '/thirdparty/macos'
platform_paths = [windows_path, linux_path, macos_path]

# empty directories
for path in platform_paths:
   shutil.rmtree(path, ignore_errors=True)
   os.mkdir(path)
   os.mkdir(path + '/bin')

# download and unpack to temp
def download_unpack_temp(url, kind):
    content = requests.get(url).content
    if (kind == 'zip'):
        zipfile.ZipFile(io.BytesIO(content)).extractall(temp_path)
    elif (kind == 'tar.gz'):
        tarfilename = f'{temp_path}/arch.tar.gz'
        with open(tarfilename, 'wb') as f:
            f.write(content)
            f.close()
        file = tarfile.open(tarfilename)  
        file.extractall(temp_path)
        file.close()  

# copy binary
def copy_binary(target_directory, temp_filename, platform):
    filename = temp_path + '/' + temp_filename
    if (platform == "windows"):
        filename = filename + '.exe'
    shutil.copyfile(filename, target_directory + '/' + os.path.basename(filename))

# copy folder
def copy_folder(target_directory, temp_directory):
    directory = temp_path + '/' + temp_directory
    shutil.copytree(directory, target_directory)

# GN
def download_gn(target, url, platform, version):
    # unarchive
    download_unpack_temp(url, 'zip')
    # copying
    copy_binary(target, 'gn', platform)
    copy_folder(target + '/.cipdpkg', '.cipdpkg')

# CMake
def download_cmake(target, url, platform, version):
    # unarchive
    name = f'cmake-{version}-{platform}-'
    kind = 'tar.gz'
    if (platform == 'windows'):
        name = name + 'x86_64'
        kind = 'zip'
    elif (platform == 'linux'):
        name = name + 'x86_64'
    else:
        name = name + 'universal'
    download_unpack_temp(f'{url}/{name}.{kind}', kind)    
    # copying
    if (platform == 'macos'):
       name = name + '/CMake.app/Contents'
    copy_folder(target + '/share', name + '/share')
    target_bin = target + '/bin'   
    source_bin = name + '/bin'
    copy_binary(target_bin, source_bin + '/cmake', platform)
    copy_binary(target_bin, source_bin + '/ctest', platform)
    copy_binary(target_bin, source_bin + '/cpack', platform)
    if (platform == 'windows'):
        copy_binary(target_bin, source_bin + '/cmcldeps', platform)

# Ninja
def download_ninja(target, url, platform, version):
    # unarchive
    p = platform
    if (platform != 'linux'):
        p = platform[:3]
    download_unpack_temp(f'{url}/ninja-{p}.zip', 'zip')
    # copying
    copy_binary(target, 'ninja', platform)
    
# Makefile
def download_makefile(target, url, platform, version):
    print(f'Makefile target path: {target}, url: {url}, platform: {platform}, version: {version}')

# utilites
utils = json.loads(
'''
[
    {
        "name": "GN",
        "url": {
            "windows": "https://chrome-infra-packages.appspot.com/dl/gn/gn/windows-amd64/+/latest",
            "linux": "https://chrome-infra-packages.appspot.com/dl/gn/gn/linux-amd64/+/latest",
            "macos": "https://chrome-infra-packages.appspot.com/dl/gn/gn/mac-amd64/+/latest"
        },
        "binaries": [
            "gn"
        ]
    },
    {
        "name": "CMake",
        "url": "https://github.com/Kitware/CMake",
        "binaries": [
            "bin/cmake",
            "bin/ctest",
            "bin/cpack"
        ]
    },
    {
        "name": "Ninja",
        "url": "https://github.com/ninja-build/ninja",
        "binaries": [
            "ninja"
        ]
    },
    {
        "name": "ToDo Makefile",
        "url": ""
    }    
]''')
download_funcs = [download_gn, download_cmake, download_ninja, download_makefile]

# download binaries
for util_index, util in enumerate(utils):
    # item
    name = util['name']
    base_url = util['url']
    base_url_dict = type(base_url) is dict
    if (base_url == ''):
        continue
    print(f'{name} downloading...', flush=True)
    
    # releases url (for GitHub)
    releases_url = ''
    version = ''
    if (not base_url_dict):
        releases_url = requests.get(f'{base_url}/releases/latest').url
        full_version = os.path.basename(releases_url)
        version = full_version
        if (full_version[0] == 'v'):
            version = full_version[1:]
        print(f'Releases url (version {version}): "{releases_url}"', flush=True)

    # each platforms
    for target in platform_paths:
        # parameters
        platform = os.path.basename(target)
        if (base_url_dict):
            url = base_url[platform]
        else:
            url = os.path.dirname(os.path.dirname(releases_url)) + '/download/' + full_version

        # empty temp directory
        shutil.rmtree(temp_path, ignore_errors=True)
        os.mkdir(temp_path)

        # downloading
        download_funcs[util_index](target, url, platform, version)

        # remove temp directory
        shutil.rmtree(temp_path, ignore_errors=True)

        # binaries permissions
        for path in util.get('binaries', []):
            filename = target + '/' + path
            if (platform == "windows"):
                filename = filename + '.exe'
            st = os.stat(filename)
            os.chmod(filename, st.st_mode | stat.S_IEXEC)