// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	context.subscriptions.push(vscode.commands.registerCommand('cpp.cmakeClean', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('cpp.cmakeClean command running');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cpp.cmakeRelease', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('cpp.cmakeRelease command running');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cpp.cmakeDebug', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('cpp.cmakeDebug command running');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cpp.cmakeRebug', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('cpp.cmakeRebug command running');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('cpp.cmakeMinimize', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('cpp.cmakeMinimize command running');
	}));
}

// This method is called when your extension is deactivated
export function deactivate() {}
