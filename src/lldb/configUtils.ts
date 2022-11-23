import { QuickPickItem, WorkspaceConfiguration, DebugConfiguration, OutputChannel } from 'vscode';
import * as cp from 'child_process';
import * as async from './novsc/async';
import { Dict } from './novsc/commonTypes';
import {expandVariablesInObject } from './novsc/expand';


export function isEmpty(obj: any): boolean {
    if (obj === null || obj === undefined)
        return true;
    if (typeof obj == 'number' || obj instanceof Number)
        return false;
    if (typeof obj == 'string' || obj instanceof String)
        return obj.length == 0;
    if (obj instanceof Array)
        return obj.length == 0;
    return Object.keys(obj).length == 0;
}

export function logProcessOutput(process: cp.ChildProcess, output: OutputChannel) {
    process.stdout.on('data', chunk => {
        output.append(chunk.toString());
    });
    process.stderr.on('data', chunk => {
        output.append(chunk.toString());
    });
}

export interface LLDBDirectories {
    shlibDir: string;
    supportExeDir: string;
}

export async function getLLDBDirectories(executable: string): Promise<LLDBDirectories> {
    let statements = [];
    for (let type of ['ePathTypeLLDBShlibDir', 'ePathTypeSupportExecutableDir']) {
        statements.push(`print('<!' + lldb.SBHostOS.GetLLDBPath(lldb.${type}).fullpath + '!>')`);
    }
    let args = ['-b', '-O', `script ${statements.join(';')}`];
    let { stdout, stderr } = await async.cp.execFile(executable, args);
    let m = (/^<!([^!]*)!>$[^.]*^<!([^!]*)!>/m).exec(stdout);
    if (m) {
        return {
            shlibDir: m[1],
            supportExeDir: m[2]
        };
    } else {
        throw new Error(stderr);
    }
}

