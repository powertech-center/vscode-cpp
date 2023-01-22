import * as cp from 'child_process';
import * as path from 'path';
import * as async from './async';
import * as os from 'os';
import { Readable } from 'stream';
import { Dict, Environment } from './commonTypes';
import { mergedEnvironment } from './expand';

export let adapter_path = 'thirdparty/codelldb/adapter'

export interface AdapterStartOptions {
    extensionRoot: string;
    workDir: string;
    extraEnv: Dict<string>; // extra environment to be set for adapter
    port: number,
    connect: boolean, // Whether to connect or to listen on the port
    adapterParameters: Dict<any>; // feature parameters to pass on to the adapter
    verboseLogging: boolean;
}

export interface ProcessSpawnParams {
    command: string,
    args: string[],
    options: cp.SpawnOptions
}

export async function getSpawnParams(
    liblldb: string,
    options: AdapterStartOptions
): Promise<ProcessSpawnParams> {

    let executable = path.join(options.extensionRoot, adapter_path, 'codelldb');
    let portAction = options.connect ? '--connect' : '--port';
    let args = ['--liblldb', liblldb, portAction, options.port.toString()];
    if (options.adapterParameters) {
        args = args.concat(['--params', JSON.stringify(options.adapterParameters)]);
    }
    let env = getAdapterEnv(options.extraEnv);
    /*env['RUST_TRACEBACK'] = '1';
    if (options.verboseLogging) {
        env['RUST_LOG'] = 'error,codelldb=debug';
    }*/

    // Check if workDir exists and is a directory, otherwise launch with default cwd.
    let workDir = options.workDir;
    if (workDir) {
        let stat = await async.fs.stat(workDir).catch(_ => null);
        if (!stat || !stat.isDirectory())
            workDir = undefined;
    }

    // Make sure that adapter gets launched with the correct architecture preference setting if
    // launched by translated x86 VSCode.
    if (await isRosetta()) {
        args = ['--arm64', executable].concat(args);
        executable = 'arch';
    }

    return {
        command: executable,
        args: args,
        options: {
            env: env,
            cwd: workDir
        }
    }
}

export async function start(
    liblldb: string,
    options: AdapterStartOptions
): Promise<cp.ChildProcess> {

    let spawnParams = await getSpawnParams(liblldb, options);
    spawnParams.options.stdio = ['ignore', 'pipe', 'pipe'];
    return cp.spawn(spawnParams.command, spawnParams.args, spawnParams.options);
}

export function getAdapterEnv(extraEnv: Dict<string>): Environment {
    let env = mergedEnvironment(extraEnv);
    // Scrub backlisted environment entries, unless they were added explicitly via extraEnv.
    for (let name of ['PYTHONHOME', 'PYTHONPATH', 'CODELLDB_STARTUP']) {
        if (extraEnv[name] === undefined)
            delete env[name];
    }
    return env;
}

// Whether this is an x86 process running on Apple M1 CPU.
export async function isRosetta(): Promise<boolean> {
    return await isRosettaAsync;
}

async function isRosettaImpl(): Promise<boolean> {
    if (os.platform() == 'darwin' && os.arch() == 'x64') {
        let sysctl = await async.cp.execFile('sysctl', ['-in', 'sysctl.proc_translated'], { encoding: 'utf8' });
        return parseInt(sysctl.stdout) == 1;
    } else {
        return false;
    }
}
let isRosettaAsync = isRosettaImpl();
