
# directories
Set-Location $PSScriptRoot
function Remove-Directory([string] $Directory) {
    Remove-Item $Directory -Force -Recurse -ErrorAction SilentlyContinue
}
function New-Directory([string] $Directory) {
    Remove-Directory $Directory
    $null = New-Item $Directory -ItemType Directory -Force   
}
function Copy-Directory([string] $SourcePath, [string] $Directory)
{
    $null = New-Item $Directory -ItemType Directory -Force 
    Copy-Item -Path "$SourcePath/*" -Destination $Directory -Recurse -Force -ErrorAction Stop
}
$AssetsPath = "$PSScriptRoot/assets".Replace('\', '/')
$TempPath = "$PSScriptRoot/.temp".Replace('\', '/')
New-Directory $AssetsPath
New-Directory $TempPath

# binary rules
function Set-ExecutablePermissions($Path) {
    if (($IsLinux) -or ($IsMacOS)) {
        chmod +x $Path
    }
}

# basic project class
class Project {
    [Hashtable] $Values
    [string] $Name
    [string] $TargetPath
    [string] $TempPath
    [string] $ArchivePath
    [string] $Platform
    [string] $OS
    [string] $Architecture
    [string] $Url
    [string] $Version

    Project([Hashtable] $Values, [string] $Platform, [string] $Url, [string] $Version) {
        $this.Values = $Values
        $this.Name = $Values.name
        $this.TargetPath = "$Global:TempPath/$Platform"
        $this.TempPath = "$Global:TempPath/$($this.Name)"
        $this.ArchivePath = "$($this.TempPath)/$(Split-Path -Path $Url -Leaf)"
        $this.Platform = $Platform
        $this.OS = $Platform.Substring(0, $Platform.IndexOf("-"))
        $this.Architecture = $Platform.Substring($Platform.LastIndexOf("-") + 1)
        $this.Url = $Url
        $this.Version = $Version

        New-Directory $this.TempPath
    }

    [void] Download([string] $Path, [string] $Url) {
        Invoke-WebRequest $Url -OutFile $Path
    }

    [void] Unarchive([string] $Directory, [string] $FileName) {

        $Ext = Split-Path -Path $FileName -Extension
        if (($Ext -eq ".zip") -or  ($Ext -eq ".vsix")) {
            Expand-Archive -LiteralPath $FileName -DestinationPath $Directory -Force
        }        
        elseif ($Ext -eq ".gz") {
            $TarFileName = $FileName.Substring(0, $FileName.Length - 3)
            if ((Split-Path -Path $TarFileName -Extension) -ne ".tar") {
                $TarFileName = "" 
            }

            $Global:LASTEXITCODE = 0
            if ($TarFileName -ne "") {
                7z x $FileName "-o$(Split-Path -Path $TarFileName)/"
                $Local:FileName = $TarFileName
            }
         
            if ($Global:LASTEXITCODE -eq 0) {
                7z x $FileName "-o$Directory/"
            }

            if ($Global:LASTEXITCODE -ne 0) {
		        throw "7z invalid operation, exit code: $LASTEXITCODE"
	        }
        }
        else {
            throw "Unknown kind of achive $Ext"
        }        
    }

    [void] Unpack() {
        Write-Host "Unpack logic of $($this.Name) project not yet defined"
    }

    [void] RemoveBinary([string] $FileName) {
        if ($this.OS -eq "windows") {
            $Local:FileName += ".exe" 
        }
        Remove-Item $FileName -Force -Recurse -ErrorAction SilentlyContinue 
    }
}

class NinjaProject: Project {

    NinjaProject([Hashtable] $Values, [string] $Platform, [string] $Url, [string] $Version) 
        : base($Values, $Platform, $Url, $Version) {}

    [void] Unpack() {
        $this.Download($this.ArchivePath, $this.Url)
        $this.Unarchive("$($this.TargetPath)/bin", $this.ArchivePath)
    }
}

class GNProject: Project {

    GNProject([Hashtable] $Values, [string] $Platform, [string] $Url, [string] $Version) 
        : base($Values, $Platform, $Url, $Version) {
        $this.ArchivePath = "$($this.TempPath)/$Platform.zip"
    }

    [void] Unpack() {
        $this.Download($this.ArchivePath, $this.Url)
        $this.Unarchive("$($this.TargetPath)/bin", $this.ArchivePath)

        if ($this.Version -eq "") {
            if ((($Global:IsWindows) -and ($this.Platform -eq "windows-x64")) -or 
                (($Global:IsLinux) -and ($this.Platform -eq "linux-x64")) -or 
                (($Global:IsMacOS) -and ($this.Platform -eq "macos-x64"))) {
                    $BinaryPath = "$($this.TargetPath)/bin/gn"
                    if ($Global:IsWindows) {
                        $BinaryPath += ".exe" 
                    }
                    Set-ExecutablePermissions $BinaryPath
                    $Version = (Invoke-Expression "$BinaryPath --version").Trim()
                    if ($Version.IndexOf(" ") -ge 0) {
                        $Version = $Version.Substring(0, $Version.IndexOf(" ")) 
                    }
                    $this.Version = $Version
                }
        }
    }
}

class CMakeProject: Project {

    CMakeProject([Hashtable] $Values, [string] $Platform, [string] $Url, [string] $Version) 
        : base($Values, $Platform, $Url, $Version) {}

    [void] Unpack() {
        $this.Download($this.ArchivePath, $this.Url)
        $this.Unarchive($this.TempPath, $this.ArchivePath)

        $BaseName = Split-Path -Path $this.ArchivePath -LeafBase
        if ((Split-Path -Path $BaseName -Extension) -eq ".tar") {
            $BaseName = Split-Path -Path $BaseName -LeafBase 
        }
        $SourcePath = "$($this.TempPath)/$BaseName"
        if ($this.OS -eq "macos") {
            $SourcePath += "/CMake.app/Contents"
        }

        $this.RemoveBinary("$SourcePath/bin/ccmake")
        $this.RemoveBinary("$SourcePath/bin/cmake-gui")

        Copy-Directory "$SourcePath/bin" "$($this.TargetPath)/bin"
        Copy-Directory "$SourcePath/share" "$($this.TargetPath)/share"
    }
}

class CodeLLDBProject: Project {

    CodeLLDBProject([Hashtable] $Values, [string] $Platform, [string] $Url, [string] $Version) 
        : base($Values, $Platform, $Url, $Version) {
        $this.TargetPath += "/codelldb"
    }

    [void] Unpack() {
        $this.Download($this.ArchivePath, $this.Url)
        $this.Unarchive($this.TempPath, $this.ArchivePath)

        $SourcePath = "$($this.TempPath)/extension"
        Copy-Directory "$SourcePath/lldb" $this.TargetPath
        Copy-Directory "$SourcePath/adapter" "$($this.TargetPath)/adapter"
    }    
}


try 
{
    # initilization
    if ($Env:version -ne "") {
        $ExtensionVersion = $Env:version
    }
    else {
        $ExtensionVersion = Get-Date -Format "yy.MM.dd" -AsUTC
    }
    $Versions = @{
        "Extension" = $ExtensionVersion
        "local" = @{}
    }
    $Platforms = @(
        "windows-x64"
        "linux-x64"
        "linux-arm64"
        "macos-x64"
        "macos-arm64"
    )

    # thirdparty projects
    $Projects = @(
        @{
            "name" = "Ninja"
            "url" = @{
                "windows-x64" = "https://github.com/ninja-build/ninja/releases/download/vVERSION/ninja-win.zip"
                "linux-x64" = "https://github.com/ninja-build/ninja/releases/download/vVERSION/ninja-linux.zip"
                "linux-arm64" = "https://github.com/ninja-build/ninja/releases/download/vVERSION/ninja-linux.zip"
                "macos-x64" = "https://github.com/ninja-build/ninja/releases/download/vVERSION/ninja-mac.zip"
                "macos-arm64" = "https://github.com/ninja-build/ninja/releases/download/vVERSION/ninja-mac.zip"
            }
            "binaries" = "bin/ninja"
            "class" = [NinjaProject]
        },
        @{
            "name" = "ToDo Makefile"
            "url" = ""
            "class" = $null
        },
        @{
            "name" = "GN"
            "url" = @{
                "windows-x64" = "https://chrome-infra-packages.appspot.com/dl/gn/gn/windows-amd64/+/latest"
                "linux-x64" = "https://chrome-infra-packages.appspot.com/dl/gn/gn/linux-amd64/+/latest"
                "linux-arm64" = "https://chrome-infra-packages.appspot.com/dl/gn/gn/linux-arm64/+/latest"
                "macos-x64" = "https://chrome-infra-packages.appspot.com/dl/gn/gn/mac-amd64/+/latest"
                "macos-arm64" = "https://chrome-infra-packages.appspot.com/dl/gn/gn/mac-arm64/+/latest"
            }
            "binaries" = "bin/gn"
            "class" = [GNProject]
        },
        @{
            "name" = "CMake"
            "url" = @{
                "windows-x64" = "https://github.com/Kitware/CMake/releases/download/vVERSION/cmake-VERSION-windows-x86_64.zip"
                "linux-x64" = "https://github.com/Kitware/CMake/releases/download/vVERSION/cmake-VERSION-linux-x86_64.tar.gz"
                "linux-arm64" = "https://github.com/Kitware/CMake/releases/download/vVERSION/cmake-VERSION-linux-aarch64.tar.gz"
                "macos-x64" = "https://github.com/Kitware/CMake/releases/download/vVERSION/cmake-VERSION-macos-universal.tar.gz"
                "macos-arm64" = "https://github.com/Kitware/CMake/releases/download/vVERSION/cmake-VERSION-macos-universal.tar.gz"
            }
            "binaries" = @(
                "bin/cmake"
                "bin/ctest"
                "bin/cpack"
            )
            "class" = [CMakeProject]
        },
        @{
            "name" = "CodeLLDB"
            "url" = @{
                "windows-x64" = "https://github.com/vadimcn/vscode-lldb/releases/download/vVERSION/codelldb-x86_64-windows.vsix"
                "linux-x64" = "https://github.com/vadimcn/vscode-lldb/releases/download/vVERSION/codelldb-x86_64-linux.vsix"
                "linux-arm64" = "https://github.com/vadimcn/vscode-lldb/releases/download/vVERSION/codelldb-aarch64-linux.vsix"
                "macos-x64" = "https://github.com/vadimcn/vscode-lldb/releases/download/vVERSION/codelldb-x86_64-darwin.vsix"
                "macos-arm64" = "https://github.com/vadimcn/vscode-lldb/releases/download/vVERSION/codelldb-aarch64-darwin.vsix"
            }
            "binaries" = @(
                "codelldb/bin/lldb"
                "codelldb/bin/lldb-argdumper"
                "codelldb/adapter/codelldb"
            )
            "class" = [CodeLLDBProject]
        }
    )

    # downloading
    foreach ($_ in $Platforms) {
        New-Directory "$TempPath/$_" 
    }
    foreach ($Project in $Projects) {
        if ($null -eq $Project.class) {
            continue
        }
        Write-Host "$($Project.name) downloading..."

        $Version = ""
        foreach ($Platform in $Platforms) {
            # version
            $Url = $Project.url[$Platform]
            if (($Version -eq "") -and ($Url -like "https://github.com/*/releases/download/*")) {
                $LastestUrl = $Url.Substring(0, $Url.IndexOf("/releases/download/")) + "/releases/latest"
                $Resp = [System.Net.WebRequest]::Create($LastestUrl).GetResponse()
                $Version = $Resp.ResponseUri.OriginalString.Substring($Resp.ResponseUri.OriginalString.LastIndexOf("/") + 1)
                $Resp.Close()
                $Resp.Dispose()
                if ($Version -like "v*") {
                    $Version = $Version.Substring(1) 
                }
                Write-Host "Version $Version detected"
                $Versions.local[$Project.name] = $Version
            }

            # url
            if ($Version -ne "") {
                $Url = $Url.Replace("VERSION", $Version)
            }

            # Unpacking
            $Instance = $Project.class::new($Project, $Platform, $Url, $Version)
            $Instance.Unpack()
            Remove-Directory $Instance.TempPath
            if (($Version -eq "") -and ($Instance.Version -ne "")) {
                $Version = $Instance.Version
                Write-Host "Version $Version detected"
                $Versions.local[$Project.name] = $Version
            }
        }
    }

    # binary permissions, versions, archives
    Write-Host "Packing..."
    foreach ($Platform in $Platforms) {
        # path
        $Ext = ""
        if ($Platform -like "windows-*") {
            $Ext = ".exe" 
        }
        $SourcePath = "$TempPath/$Platform"

        # permissions
        foreach ($Project in $Projects) {
            if ($null -eq $Project.class) {
                continue
            }

            foreach ($_ in $Project.binaries) {
                $BinaryPath = "$SourcePath/$_$Ext"
                if (Test-Path $BinaryPath) {
                    Set-ExecutablePermissions $BinaryPath
                }
                else {
                    Write-Host "Binary file $BinaryPath not found"
                }
            }
        }

        # versions
        Set-Content -Path "$SourcePath/_versions.json" -Value (ConvertTo-Json $Versions -Depth 100)

        # archive
        7z a "$AssetsPath/thirdparty-$Platform.zip" "$SourcePath/*"
        if ($Global:LASTEXITCODE -ne 0) {
            throw "7z invalid operation, exit code: $LASTEXITCODE"
        }
    }
    
    # final assets
    $VersionsMarker = ""
    foreach ($Project in $Projects) {
        if ($null -eq $Project.class) {
            continue
        }
        $Version = $Versions.local[$Project.name]
        $VersionsMarker += "$($Project.name)-$Version, ".ToLower()
    }
    Set-Content -Path "$AssetsPath/versions.json" -Value (ConvertTo-Json $Versions -Depth 100)
    Set-Content -Path "$AssetsPath/versions.txt" -Value ($VersionsMarker.Substring(0, $VersionsMarker.Length - 2))
}
finally 
{
    Remove-Directory $TempPath
}

# done
Write-Host ""
Write-Host "Done"
if (($IsWindows) -and ($Env:TERM_PROGRAM -ne "vscode"))
{
    Write-Host "Press any key to continue..." -NoNewline
    [void][System.Console]::ReadKey($true)
    Write-Host ""	
}
