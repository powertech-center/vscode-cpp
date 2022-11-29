// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as toolchain from './toolchain';
import * as thirdparty from './thirdparty';
import * as cmakesyntax from "./cmake/cmake-syntax";
import * as __cmake from "./cmake/__cmake";
import * as cmake from "./cmake/cmake";
import * as clangd from "./clangd/clangd";
import * as lldb from "./lldb/main";


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

	// toolchain
	if (!(await toolchain.init())) {
		await vscode.window.showErrorMessage("PowerTech C/C++ Extension not activated: invalid toolchain.")	
		return false
	}

	// third party binaries
	if (!(await thirdparty.actualize(context))) {
		await vscode.window.showErrorMessage("PowerTech C/C++ Extension not activated: invalid thirdparty.")	
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

	// CMake syntax
	cmakesyntax.activate(context)

	// CMake commands
	__cmake.activate(context)
	cmake.activate(context)	
	

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
	
	// On configure changed
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('cpp.path')) {
			toolchain.init();
		}
	}));

	// done
	return true
}

// This method is called when your extension is deactivated
export function deactivate() {}
