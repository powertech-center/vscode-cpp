// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as cmakesyntax from "./cmake/cmake-syntax";
import * as cmake from "./cmake/cmake";

export function setGNIsProject(value: boolean) {
	vscode.commands.executeCommand('setContext', 'gn:isPoject', value);
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
export function activate(context: vscode.ExtensionContext) {

	// detect C/C++ project
	let GNIsProject = false
    let CMakeIsProject = false
	let NinjaIsProject = false
	let MakefileIsProject = false
	if(vscode.workspace.workspaceFolders !== undefined) {
		let folder = vscode.workspace.workspaceFolders[0].uri.fsPath 
		GNIsProject = fs.existsSync(folder + '/BUILD.gn')
		CMakeIsProject = fs.existsSync(folder + '/CMakeLists.txt')
		NinjaIsProject = fs.existsSync(folder + '/build.ninja')
		MakefileIsProject = fs.existsSync(folder + '/Makefile') || fs.existsSync(folder + '/makefile') || fs.existsSync(folder + '/GNUmakefile')
	}
	setGNIsProject(GNIsProject)
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

}

// This method is called when your extension is deactivated
export function deactivate() {}
