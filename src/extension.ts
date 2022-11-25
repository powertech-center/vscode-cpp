// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as os from 'os';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yauzl from 'yauzl';
import * as cmakesyntax from "./cmake/cmake-syntax";
import * as cmake from "./cmake/cmake";
import * as clangd from "./clangd/clangd";
import * as lldb from "./lldb/main";
import * as async from './lldb/novsc/async';

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

const unzip = (zipPath: string, unzipToDir: string) => {
    return new Promise<void>((resolve, reject) => {
        try {
            // Create folder if not exists
			fs.mkdir(unzipToDir, { recursive: true }, (err) => {});

            // Same as example we open the zip.
            yauzl.open(zipPath, { lazyEntries: true }, (err, zipFile) => {
                if (err) {
                    zipFile.close();
                    reject(err);
                    return;
                }

                // This is the key. We start by reading the first entry.
                zipFile.readEntry();

                // Now for every entry, we will write a file or dir 
                // to disk. Then call zipFile.readEntry() again to
                // trigger the next cycle.
                zipFile.on('entry', (entry) => {
                    try {
                        // Directories
                        if (/\/$/.test(entry.fileName)) {
                            // Create the directory then read the next entry.
							//fs.mkdirSync(path.join(unzipToDir, entry.fileName), (err) => {}
							fs.mkdir(path.join(unzipToDir, entry.fileName), { recursive: true }, (err) => {});
                            zipFile.readEntry();
                        }
                        // Files
                        else {
                            // Write the file to disk.
                            zipFile.openReadStream(entry, (readErr, readStream) => {
                                if (readErr) {
                                    zipFile.close();
                                    reject(readErr);
                                    return;
                                }

                                const file = fs.createWriteStream(path.join(unzipToDir, entry.fileName));
                                readStream.pipe(file);
                                file.on('finish', () => {
                                    // Wait until the file is finished writing, then read the next entry.
                                    // @ts-ignore: Typing for close() is wrong.
                                    file.close(() => {
                                        zipFile.readEntry();
                                    });

                                    file.on('error', (err) => {
                                        zipFile.close();
                                        reject(err);
                                    });
								});
                            });
                        }
                    }
                    catch (e) {
                        zipFile.close();
                        reject(e);
                    }
                });
                zipFile.on('end', (err) => {
                    resolve();
                });
                zipFile.on('error', (err) => {
                    zipFile.close();
                    reject(err);
                });
            });
        }
        catch (e) {
            reject(e);
        }
    });
}

async function actualizeThirdparty(context: vscode.ExtensionContext): Promise<Boolean> {

	// cleanup thirdparty directory
	let thirdpartyPath = path.join(context.extensionPath, "thirdparty")
	console.log(`Thirdparty folder "${thirdpartyPath}" cleaning`)
	fs.readdirSync(thirdpartyPath).forEach(name => {
		let fullPath = path.join(thirdpartyPath, name)
		let directory = fs.statSync(fullPath).isDirectory()
		let remove = true
		
		if ((directory) && (name == "gyp")) {
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
	let projectUrl = "https://github.com/d-mozulyov/dummy-thirdparty" // ToDo
	let version = vscode.extensions.getExtension('PowerTech.powercpp').packageJSON.version
	if (version == "0.0.0") {
		let response = await async.https.get(projectUrl + "/releases/latest");
		let location = response.headers.location
		version = location.slice(location.length - 8)
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
                let lastPercentage = 0;
                let reportProgress = (downloaded: number, contentLength: number) => {
                    let percentage = Math.round(downloaded / contentLength * 91);
                    progress.report({
                        message: `${percentage}%`,
                        increment: percentage - lastPercentage
                    });
                    lastPercentage = percentage;
                };

                let downloadTarget = path.join(os.tmpdir(), `powercpp-${process.pid}-${Math.floor(Math.random() * 1e10)}.zip`);

                await download(vscode.Uri.parse(thirdpartyUrl), downloadTarget, reportProgress);

                //await installVsix(context, downloadTarget);
				await unzip(downloadTarget, thirdpartyPath)

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

export function setGNIsProject(value: boolean) {
	vscode.commands.executeCommand('setContext', 'gn:isPoject', value);
}

export function setGYPIsProject(value: boolean) {
	vscode.commands.executeCommand('setContext', 'gyp:isPoject', value);
}

export function setCMakeIsProject(value: boolean) {
	vscode.commands.executeCommand('setContext', 'cmake:isPoject', value);
}

export function setNinjaIsProject(value: boolean) {
	vscode.commands.executeCommand('setContext', 'ninja:isPoject', value);
}

export function setMakefileIsProject(value: boolean) {
	vscode.commands.executeCommand('setContext', 'makefile:isPoject', value);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext): Promise<Boolean> {

	// third party binaries check
	if (!fs.existsSync(context.extensionPath + '/thirdparty/versions.json')) {
		let done = await actualizeThirdparty(context)
		if (!done) 
			return false
	}

	// detect C/C++ project
	let GNIsProject = false
	let GYPIsProject = false
    let CMakeIsProject = false
	let NinjaIsProject = false
	let MakefileIsProject = false
	if(vscode.workspace.workspaceFolders !== undefined) {
		let folder = vscode.workspace.workspaceFolders[0].uri.fsPath 
		GNIsProject = fs.existsSync(folder + '/BUILD.gn')
		GYPIsProject = fs.existsSync(folder + '/*.gyp')
		CMakeIsProject = fs.existsSync(folder + '/CMakeLists.txt')
		NinjaIsProject = fs.existsSync(folder + '/build.ninja')
		MakefileIsProject = fs.existsSync(folder + '/Makefile') || fs.existsSync(folder + '/makefile') || fs.existsSync(folder + '/GNUmakefile')
	}
	setGNIsProject(GNIsProject)
	setGYPIsProject(GYPIsProject)
	setCMakeIsProject(CMakeIsProject)
	setNinjaIsProject(NinjaIsProject)
	setMakefileIsProject(MakefileIsProject)

	// GN commands
	context.subscriptions.push(vscode.commands.registerCommand('cpp.gnClean', () => {
		vscode.window.showInformationMessage('cpp.gnClean command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.gnRelease', () => {
		vscode.window.showInformationMessage('cpp.gnRelease command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.gnDebug', () => {
		vscode.window.showInformationMessage('cpp.gnDebug command running');
	}));

	// GYP syntax
	// ToDo gypsyntax.activate(context)

	// GYP commands
	context.subscriptions.push(vscode.commands.registerCommand('cpp.gypClean', () => {
		vscode.window.showInformationMessage('cpp.gypClean command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.gypRelease', () => {
		vscode.window.showInformationMessage('cpp.gypRelease command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.gypDebug', () => {
		vscode.window.showInformationMessage('cpp.gypDebug command running');
	}));

	/*
	// CMake syntax
	cmakesyntax.activate(context)

	// CMake commands
	cmake.activate(context)
	*/

	// Ninja commands
	context.subscriptions.push(vscode.commands.registerCommand('cpp.ninjaClean', () => {
		vscode.window.showInformationMessage('cpp.ninjaClean command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.ninjaRelease', () => {
		vscode.window.showInformationMessage('cpp.ninjaRelease command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.ninjaDebug', () => {
		vscode.window.showInformationMessage('cpp.ninjaDebug command running');
	}));

	// Makefile commands
	context.subscriptions.push(vscode.commands.registerCommand('cpp.makefileClean', () => {
		vscode.window.showInformationMessage('cpp.makefileClean command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.makefileRelease', () => {
		vscode.window.showInformationMessage('cpp.makefileRelease command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.makefileDebug', () => {
		vscode.window.showInformationMessage('cpp.makefileDebug command running');
	}));

	// clangd LSP server
	clangd.activate(context)

	// LLDB-based launcher/debugger
	lldb.activate(context)

	// done
	return true
}

// This method is called when your extension is deactivated
export function deactivate() {}
