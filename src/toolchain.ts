import * as os from 'os';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as fileutils from './fileutils'

export const toolchainUrl = 'https://github.com/powertech-center/clang'

export let isValid: boolean = false
export let isPowerTech: boolean = false
export let clangPath: string = ""
export let clangcppPath: string = ""
export let clangclPath: string = ""
export let clangdPath: string = ""
export let lldbPath: string = ""
export let vscodelldbPath: string = ""

export function clear() {
    isValid = false
    isPowerTech = false
    clangPath = ""
    clangcppPath = ""
    clangclPath = ""
    clangdPath = ""
    lldbPath = ""
    vscodelldbPath = ""    
}

function getConfigurationTarget(configuration: vscode.WorkspaceConfiguration, name: string): vscode.ConfigurationTarget {
    let ret = vscode.ConfigurationTarget.Global

    const info = configuration.inspect(name)
    if (info != undefined) {
        if (info.workspaceFolderValue != undefined) {
            ret = vscode.ConfigurationTarget.WorkspaceFolder
        }
        else if (info.workspaceValue != undefined) {
            ret = vscode.ConfigurationTarget.Workspace
        } 
    }

    return ret
}

export async function init(): Promise<Boolean> {

    while (true) {
        // clear values anyway
        clear()

        // configuration
        const cppConfig = vscode.workspace.getConfiguration('cpp')
        const cppPath = cppConfig.get<string>('path').trim()       
        const cppPathTarget = getConfigurationTarget(cppConfig, 'path')
        const isCppPathDefault = (cppPath == '' || cppPath == undefined)
        const clangBinName = 'clang' + fileutils.binExt

        // try to find toolchain
        let foundPath = ''
        if (isCppPathDefault) {
            let compilerPath = fileutils.findGlobalFile(clangBinName)
            if (compilerPath != '') {
                foundPath = path.dirname(compilerPath)
            }
        }
        else {
            if (fileutils.fileExists(path.join(cppPath, clangBinName))) {
                foundPath = cppPath
            }
            else if (fileutils.fileExists(path.join(cppPath, 'bin', clangBinName))) {
                foundPath = path.join(cppPath, 'bin')
            }            
        }

        // check is path valid
        if (foundPath != '') {
            clangPath = path.join(foundPath, clangBinName)
            clangcppPath = path.join(foundPath, 'clang++' + fileutils.binExt)
            clangclPath = path.join(foundPath, 'clang-cl' + fileutils.binExt)
            clangdPath = path.join(foundPath, 'clangd' + fileutils.binExt)
            lldbPath = path.join(foundPath, 'lldb' + fileutils.binExt)
            vscodelldbPath = path.join(foundPath, 'lldb-vscode' + fileutils.binExt)  

            isValid = (fileutils.fileExists(clangPath)) && 
                (fileutils.fileExists(clangcppPath)) &&
                (fileutils.fileExists(clangclPath)) &&
                (fileutils.fileExists(clangdPath)) &&
                (fileutils.fileExists(lldbPath)) &&
                (fileutils.fileExists(vscodelldbPath))
        }

        // check is path PowerTech edition
        if (isValid) {
            isPowerTech = fileutils.directoryExists(path.join(foundPath, '..', 'targets'))
            break
        }

        // toolchain not found: message, download | choose | default | cancel
        const buttonChoose = 'Choose'
        const buttonDefault = 'Default'
        const buttonDownload = 'Download'
        let warningMessage = ((cppPathTarget == vscode.ConfigurationTarget.Global)? 'Configuration' : 'Local configuration') +
            ' `cpp.path` '
        if (isCppPathDefault) {
            warningMessage += 'not defined, Clang compiler binaries not found in the global environment.'
        }
        else {
            warningMessage += 'points to a ' + (fileutils.directoryExists(cppPath)? '' : 'non-existent ') +
                `directory "${cppPath}", Clang compiler binaries not found.`
        }
        warningMessage += ' It is recommended to Choose the actual directory with binaries' +
            (isCppPathDefault? '' : ', use Default') + ' or Download them from our website.'
        let button = ''
        if (isCppPathDefault) {
            button = await vscode.window.showWarningMessage(warningMessage, buttonChoose, buttonDownload)
        }
        else {
            button = await vscode.window.showWarningMessage(warningMessage, buttonChoose, buttonDefault, buttonDownload)
        }
        
        // change 'path' configuration (choose | default) and repeat 
        if (button == buttonChoose || button == buttonDefault) {
            let folder = ''
            if (button == buttonChoose) {
                const openOpts: vscode.OpenDialogOptions = {
                    defaultUri: vscode.Uri.parse('file://' + foundPath),
                    canSelectMany: false,
                    canSelectFolders: true,
                    canSelectFiles: false,
                    title: 'Clang Binaries Folder'
                }
                const dialogRet = await vscode.window.showOpenDialog(openOpts)
                if (dialogRet == undefined) {
                    button = undefined
                } 
                else {
                    folder = dialogRet[0].fsPath 
                }                    
            }

            if (button != undefined) {
                await vscode.workspace.getConfiguration().update('cpp.path', (folder == '')? undefined : folder, cppPathTarget);
                continue
            }
        } 

        // optional open 
        if (button == buttonDownload) {
            vscode.env.openExternal(vscode.Uri.parse(toolchainUrl))
        }

        // cancellation
        break
    }

    // clear all values if any path is invalid
    if (!isValid) {
        clear()
    }

    // result
    return isValid
}
