import * as vscode from 'vscode';
import * as fs from 'fs';

import * as cmake from "./cmake/cmake"; // ToDo remove?

/*
    Project mode
*/

export let IsProject: boolean
export let IsGNProject: boolean
export let IsGYPProject: boolean
export let IsCMakeProject: boolean
export let IsNinjaProject: boolean
export let IsMakefileProject: boolean

function detectIsProject() {
    let value = (IsGNProject || IsGYPProject || IsCMakeProject || IsNinjaProject || IsMakefileProject)
    if (IsProject == value) 
        return

    IsProject = value
    vscode.commands.executeCommand('setContext', 'cpp:IsProject', IsProject)
}

function setIsGNProject(value: boolean) {
    if (IsGNProject == value) 
        return

    IsGNProject = value
	vscode.commands.executeCommand('setContext', 'cpp:IsGNProject', value)
    detectIsProject()
}

function setIsGYPProject(value: boolean) {
    if (IsGYPProject == value) 
        return

    IsGYPProject = value
	vscode.commands.executeCommand('setContext', 'cpp:IsGYPProject', value)
    detectIsProject()
}

function setIsCMakeProject(value: boolean) {
    if (IsCMakeProject == value) 
        return

    IsCMakeProject = value
	vscode.commands.executeCommand('setContext', 'cpp:IsCMakeProject', value)
    detectIsProject()
}

function setIsNinjaProject(value: boolean) {
    if (IsNinjaProject == value) 
        return

    IsNinjaProject = value
	vscode.commands.executeCommand('setContext', 'cpp:IsNinjaProject', value)
    detectIsProject()
}

function setIsMakefileProject(value: boolean) {
    if (IsMakefileProject == value) 
        return

    IsMakefileProject = value
	vscode.commands.executeCommand('setContext', 'cpp:IsMakefileProject', value)
    detectIsProject()
}

/*
    Launcher
*/

enum LauncherMode {
    Launch,
    Attach,
    Custom
}

enum BuildMode {
    Debug,
    DebugEx,
    Release,
    ReleaseEx,
    Trace,
    TraceEx,
    Minimize,
    MinimizeEx
}

export let launcher: Launcher;
export let experimentalLauncher: Launcher;

export async function activate(extension: vscode.ExtensionContext) {
    launcher = new Launcher(extension, false)
    experimentalLauncher = new Launcher(extension, true)
    await initialize()
}

export async function deactivate() {
    experimentalLauncher = undefined
    launcher = undefined
}

export async function initialize() {
    // Project mode
    let folder: string = undefined
    if(vscode.workspace.workspaceFolders !== undefined) {
		folder = vscode.workspace.workspaceFolders[0].uri.fsPath 
	}
    let hasFolder = (folder != undefined)
    setIsGNProject(hasFolder && fs.existsSync(folder + '/BUILD.gn'))
    setIsGYPProject(hasFolder && fs.existsSync(folder + '/*.gyp'))
    setIsCMakeProject(hasFolder && fs.existsSync(folder + '/CMakeLists.txt'))
    setIsNinjaProject(hasFolder && fs.existsSync(folder + '/build.ninja'))
    setIsMakefileProject(hasFolder && (fs.existsSync(folder + '/Makefile') || fs.existsSync(folder + '/makefile') || fs.existsSync(folder + '/GNUmakefile')))
}

class Launcher implements vscode.DebugConfigurationProvider {
    extension: vscode.ExtensionContext
    experimental: boolean

    constructor(extension: vscode.ExtensionContext, experimental: boolean) {
        this.extension = extension
        this.experimental = experimental
        extension.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(experimental? "powercpp":"powercpp__", this));
    }
     
    async provideDebugConfigurations(
        workspaceFolder: vscode.WorkspaceFolder | undefined,
        cancellation?: vscode.CancellationToken
    ): Promise<vscode.DebugConfiguration[]> {
        return [{
            name: 'Debug',
            type: this.experimental? "powercpp":"powercpp__",
            request: 'launch'
        }];
    }

    async resolveDebugConfiguration(
        folder: vscode.WorkspaceFolder | undefined,
        launchConfig: vscode.DebugConfiguration,
        cancellation?: vscode.CancellationToken
    ): Promise<vscode.DebugConfiguration> {
        if (Object.keys(launchConfig).length === 0) {
            return null
        } 
        else {
            return launchConfig
        }
    }

    async resolveDebugConfigurationWithSubstitutedVariables(
        folder: vscode.WorkspaceFolder | undefined,
        launchConfig: vscode.DebugConfiguration,
        cancellation?: vscode.CancellationToken
    ): Promise<vscode.DebugConfiguration> {

        // luancher mode
        let launcherMode: LauncherMode
        switch (launchConfig.request) {
            case "launch":
                launcherMode = LauncherMode.Launch
                break
            case "attach":
                launcherMode = LauncherMode.Attach
                break
            case "custom":
                launcherMode = LauncherMode.Custom
                break
        default:
            await vscode.window.showErrorMessage(`Invalid launch request "${launchConfig.request}"`, { modal: true });
            return null;
        }

        // build mode
        let buildMode: BuildMode
        switch (launchConfig.build) {
            case "debug":
                buildMode = BuildMode.Debug
                break
            case "debug+":
                buildMode = BuildMode.DebugEx
                break
            case "release":
                buildMode = BuildMode.Release
                break
            case "release+":
                buildMode = BuildMode.ReleaseEx
                break
            case "trace":
                buildMode = BuildMode.Trace
                break
            case "trace+":
                buildMode = BuildMode.TraceEx
                break
            case "minimize":
                buildMode = BuildMode.Minimize
                break
            case "minimize+":
                buildMode = BuildMode.MinimizeEx
                break
        default:
            if (launchConfig.build) {
                await vscode.window.showErrorMessage(`Invalid build mode "${launchConfig.build}"`, { modal: true });
                return null;
            }

            let launchName = launchConfig.name.toLowerCase()
            buildMode = BuildMode.Debug
            if (launchName.includes("release")) {
                buildMode = BuildMode.Release 
            } 
            else if (launchName.includes("trace")) {
                buildMode = BuildMode.Trace
            }
            else if (launchName.includes("minimize")) {
                buildMode = BuildMode.Minimize
            }
            if (launchName.endsWith("+")) {
                buildMode++
            }
        }     
        
        // (ToDo change) CMAKE_BUILD_TYPE
        let cmakeBuildType = "Debug"
        switch (buildMode) {
            case BuildMode.Release:
            case BuildMode.ReleaseEx:
                cmakeBuildType = "Release"
                break
            case BuildMode.Trace:
            case BuildMode.TraceEx:
                cmakeBuildType = "RelWithDebInfo"
                break
            case BuildMode.Minimize:
            case BuildMode.MinimizeEx:
                cmakeBuildType = "MinSizeRel"
                break
        }

        // target
        let target = launchConfig.target
        
        // program
        let program: string
        if ((target == "all") || (!launchConfig.program)) {
            program = await cmake.extensionManager.prepareLaunchTargetExecutable(target, cmakeBuildType)
            if (!program) {
                return undefined;
            }
        }
        if (!launchConfig.program) {
            launchConfig.program = program
        }

        // done
        return launchConfig
    }
}