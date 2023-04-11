import * as os from 'os';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as fileutils from './fileutils'
import * as async from './lldb/novsc/async';

let extensionPath: string
let thirdpartyPath: string
let binPath: string

let CMakePath: string
let GNPath: string
let NinjaPath: string
// ToDo let MakeFilePath: string
let LLDBPath: string
let libLLDBPath: string

export async function activate(context: vscode.ExtensionContext): Promise<Boolean> {

    extensionPath = context.extensionPath
    thirdpartyPath = path.join(extensionPath, 'thirdparty')
    binPath = path.join(thirdpartyPath, 'bin')

    // third party binaries check
    if (fs.existsSync(path.join(thirdpartyPath, "versions.json")))
        return true

	// cleanup thirdparty directory
	console.log(`Thirdparty folder "${thirdpartyPath}" cleaning`)
	fs.readdirSync(thirdpartyPath).forEach(name => {
		let fullPath = path.join(thirdpartyPath, name)
		let directory = fs.statSync(fullPath).isDirectory()
		let remove = true
		
		if ((directory) && ((name == "gyp") || (name == "meson"))) {
			remove = false
		}

		if (remove) {
			if (directory) {
				console.log(`Thirdparty folder "${fullPath}" removing`)
				fs.rmdirSync(fullPath, { recursive: true })
			}
			else {
				console.log(`Thirdparty file "${fullPath}" removing`)
				fs.rmSync(fullPath)
			}
		}
	});

	// detect thirdparty platform
	let platform: string = os.platform()
	let arch: string = os.arch()
	switch (arch) {
		case "ia32":
		case "x32":
		case "x64":
			arch = "x64"
			break
		default:
			arch = "arm64"
	}
	switch (platform) {
		case "win32":
		case "cygwin":
			platform = "windows"
		  	break	  
		case "darwin":
		  	platform = "macos"
			// check rosetta
			if (arch == "x64") {
				let sysctl = await async.cp.execFile('sysctl', ['-in', 'sysctl.proc_translated'], { encoding: 'utf8' })
        		if (parseInt(sysctl.stdout) == 1)
					arch = "arm64"
			}
		  	break	  
		default:
			platform = "linux"
	}
    platform += "-" + arch
    console.log(`Thirdparty binaries for ${platform} platform searching`)

	// thirdparty archive URL
	let archive_name = "thirdparty-" + platform + ".zip"
	let projectUrl = "https://github.com/powertech-center/vscode-cpp"
	let version = vscode.extensions.getExtension('PowerTech.powercpp').packageJSON.version
	if (version == "0.0.0") {
		let response = await async.https.get(projectUrl + "/releases/latest");
		let location = response.headers.location
		version = location.slice(location.lastIndexOf("/v") + 2)
	}
	let thirdpartyUrl = `${projectUrl}/releases/download/v${version}/${archive_name}`

	// downloading and unpacking
	try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                cancellable: false,
                title: 'Downloading PowerTech C/C++ thirdparty tools'
            },
            async (progress) => {
                const downloadPercentage: number = 80
                let lastPercentage = 0;

                let downloadTarget = path.join(os.tmpdir(), `powercpp-${process.pid}-${Math.floor(Math.random() * 1e10)}.zip`);
                await download(vscode.Uri.parse(thirdpartyUrl), downloadTarget, (downloaded: number, contentLength: number) => {
                    let percentage = Math.round(downloaded / contentLength * downloadPercentage);
                    progress.report({
                        message: `${percentage}%`,
                        increment: percentage - lastPercentage
                    });
                    lastPercentage = percentage;
                });

				await fileutils.unzip(downloadTarget, thirdpartyPath, (totalSize: number, processedSize: number) => {
                    let percentage = downloadPercentage + Math.round(processedSize / totalSize * (100 - downloadPercentage));
                    progress.report({
                        message: `${percentage}%`,
                        increment: percentage - lastPercentage
                    });
                    lastPercentage = percentage;
                });

                progress.report({
                    message: 'installing',
                    increment: 100 - lastPercentage,
                });

                await async.fs.unlink(downloadTarget);
            }
        );
    } catch (err) {
        //output.append(`Error: ${err}`);
        //output.show();
        // Show error message, but don't block on it.
        vscode.window.showErrorMessage(
            `Downloading PowerTech C/C++ thirdparty tools failed: ${err}.\n\n` +
            `Please check your internet connection, update the Extension and restart VSCode.` +
            { modal: true },
            `Check URL in a browser`
        ).then(choice => {
            if (choice != undefined)
				vscode.env.openExternal(vscode.Uri.parse(thirdpartyUrl));
        });
        return false;
    }

	// done
	fs.renameSync(path.join(thirdpartyPath, "_versions.json"), path.join(thirdpartyPath, "versions.json"))
	return true
}

async function download(srcUrl: vscode.Uri, destPath: string,
    progress?: (downloaded: number, contentLength?: number) => void) {

	const MaxRedirects = 10;	
    let location = srcUrl.toString(true);
    for (let i = 0; i < MaxRedirects; ++i) {
        let response = await async.https.get(location);
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            location = response.headers.location;
        } else {
            return new Promise(async (resolve, reject) => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    reject(new Error(`HTTP status ${response.statusCode} : ${response.statusMessage}`));
                }
                if (response.headers['content-type'] != 'application/octet-stream') {
                    reject(new Error('HTTP response does not contain an octet stream'));
                } else {
                    let stm = fs.createWriteStream(destPath, { mode: 0o600 });
                    let pipeStm = response.pipe(stm);
                    if (progress) {
                        let contentLength = response.headers['content-length'] ? Number.parseInt(response.headers['content-length']) : null;
                        let downloaded = 0;
                        response.on('data', (chunk) => {
                            downloaded += chunk.length;
                            progress(downloaded, contentLength);
                        })
                    }
                    pipeStm.on('finish', resolve);
                    pipeStm.on('error', reject);
                    response.on('error', reject);
                }
            });
        }
    }
}

function getBinaryPath(name: string, defaultDirectory: string = ""): string {
    
    name += fileutils.binExt

    let retPath = fileutils.findGlobalFile(name)
    if (retPath == "") {
        if (defaultDirectory == "") {
            retPath = path.join(binPath, name)
        } 
        else {
            retPath = path.join(defaultDirectory, name)
        }
    }

    return retPath
}

export function getCMakePath(): string {

    if (CMakePath == undefined) 
        CMakePath = getBinaryPath("cmake")
        
    return CMakePath
}

export function getGNPath(): string {

    if (GNPath == undefined)
        GNPath = getBinaryPath("gn")
        
    return GNPath
}

export function getNinjaPath(): string {

    if (NinjaPath == undefined)
        NinjaPath = getBinaryPath("ninja")
        
    return NinjaPath
}

/* ToDo export function getMakeFilePath(): string {

    if (MakeFilePath == undefined)
        MakeFilePath = getBinaryPath("make")
        
    return MakeFilePath
}*/

export function getLLDBPath(): string {

    if (LLDBPath == undefined)
        LLDBPath = path.join(thirdpartyPath, 'codelldb', 'lldb', 'bin', 'lldb')  + fileutils.binExt
        
    return LLDBPath
}

export function getLibLLDBPath(): string {

    if (libLLDBPath == undefined) {
        let platform: string = os.platform()
        switch (platform) {
            case "win32":
            case "cygwin":
                platform = "windows"
                  break
        }
        libLLDBPath = path.join(thirdpartyPath, 'codelldb', 'lldb', (platform == 'windows')? 'bin':'lib', 'liblldb')  + fileutils.libExt
    }    

    return libLLDBPath
}

export async function deactivate() {
}

