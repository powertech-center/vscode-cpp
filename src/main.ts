// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as thirdparty from './thirdparty';
import * as toolchain from './toolchain';
import * as context from './context';

import * as cmakesyntax from "./cmake/cmake-syntax";
import * as cmake from "./cmake/cmake";
import * as clangd from "./clangd/clangd";
import * as lldb from "./lldb/main";


export async function activate(extension: vscode.ExtensionContext): Promise<Boolean> {
	// third party binaries
	if (!(await thirdparty.activate(extension))) {
		await vscode.window.showErrorMessage("PowerTech C/C++ Extension not activated: invalid thirdparty.")	
		return false
	}

	// toolchain
	if (!(await toolchain.activate(extension))) {
		await vscode.window.showErrorMessage("PowerTech C/C++ Extension not activated: invalid toolchain.")	
		return false
	}

	// context
	await context.activate(extension)


	// GN commands
	/*context.subscriptions.push(vscode.commands.registerCommand('cpp.gnClean', () => {
		vscode.window.showInformationMessage('cpp.gnClean command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.gnRelease', () => {
		vscode.window.showInformationMessage('cpp.gnRelease command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.gnDebug', () => {
		vscode.window.showInformationMessage('cpp.gnDebug command running');
	}));*/

	// GYP syntax
	// ToDo gypsyntax.activate(extension)

	// GYP commands
	/*context.subscriptions.push(vscode.commands.registerCommand('cpp.gypClean', () => {
		vscode.window.showInformationMessage('cpp.gypClean command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.gypRelease', () => {
		vscode.window.showInformationMessage('cpp.gypRelease command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.gypDebug', () => {
		vscode.window.showInformationMessage('cpp.gypDebug command running');
	}));*/

	// CMake syntax
	await cmakesyntax.activate(extension)

	// CMake commands
	await cmake.activate(extension)	
	

	// Ninja commands
	/*context.subscriptions.push(vscode.commands.registerCommand('cpp.ninjaClean', () => {
		vscode.window.showInformationMessage('cpp.ninjaClean command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.ninjaRelease', () => {
		vscode.window.showInformationMessage('cpp.ninjaRelease command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.ninjaDebug', () => {
		vscode.window.showInformationMessage('cpp.ninjaDebug command running');
	}));*/

	// Makefile commands
	/*context.subscriptions.push(vscode.commands.registerCommand('cpp.makefileClean', () => {
		vscode.window.showInformationMessage('cpp.makefileClean command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.makefileRelease', () => {
		vscode.window.showInformationMessage('cpp.makefileRelease command running');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('cpp.makefileDebug', () => {
		vscode.window.showInformationMessage('cpp.makefileDebug command running');
	}));*/

	// clangd LSP server
	await clangd.activate(extension)

	// LLDB-based launcher/debugger
	await lldb.activate(extension)

	// On configure changed
	extension.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('cpp.path')) {
			toolchain.initialize();
		}
	}));

	// done
	return true
}

export async function deactivate() {
	await lldb.deactivate()
	await clangd.deactivate()
	await cmake.deactivate()
	await cmakesyntax.deactivate()
	await context.deactivate()
	await toolchain.deactivate()
	await thirdparty.deactivate()
}
