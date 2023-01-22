import {
    workspace, window, commands, debug, extensions,
    ExtensionContext, WorkspaceConfiguration, WorkspaceFolder, CancellationToken,
    DebugConfigurationProvider, DebugConfiguration, DebugAdapterDescriptorFactory, DebugSession, DebugAdapterExecutable,
    DebugAdapterDescriptor, Uri, StatusBarAlignment, QuickPickItem, StatusBarItem, UriHandler, ConfigurationTarget,
    DebugAdapterInlineImplementation
} from 'vscode';
import * as toolchain from './toolchain';
import * as thirdparty from './thirdparty';

export let instance: Launch;

export function activate(context: ExtensionContext) {
    instance = new Launch(context);
   // dbginst.onActivate();
}

export function deactivate() {
//    dbginst.onDeactivate();
}

class Launch implements DebugConfigurationProvider {
    context: ExtensionContext;

    constructor(context: ExtensionContext) {
        this.context = context;
        context.subscriptions.push(debug.registerDebugConfigurationProvider('powercpp__', this));
    }
     
    async resolveDebugConfiguration(
        folder: WorkspaceFolder | undefined,
        launchConfig: DebugConfiguration,
        cancellation?: CancellationToken
    ): Promise<DebugConfiguration> {

        if (launchConfig.request == 'launch' && ((launchConfig.program == '') || (launchConfig.program == undefined))) {
            // ToDo !!!
            launchConfig.program = '${command:cmake.buildDebug}' 
        }

        // done
        return launchConfig
    }
}