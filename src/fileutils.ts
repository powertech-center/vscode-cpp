import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as yauzl from 'yauzl';

export const binExt: string = (os.platform() == "win32")? '.exe' : ''
export const libExt: string = (os.platform() == "win32")? '.dll' : ((os.platform() == "darwin")? '.dylib' : '.so')
export const globalPaths: string[] = process.env.PATH.replace(/["]+/g, '').split(path.delimiter)

export function fileExists(fileName: string): boolean {
    try {
        let stat = fs.statSync(fileName)
        if (stat.isFile()) {
            return true
        }
    }
    catch(err) {
    }    

    return false
}

export function directoryExists(directoryName: string): boolean {
    try {
        let stat = fs.statSync(directoryName)
        if (stat.isDirectory()) {
            return true
        }
    }
    catch(err) {
    }    

    return false
}

export function findGlobalFile(fileName: string): string {

    let ret = ''

    globalPaths.some(p => {
        let pathFileName = path.join(p, fileName)
        if (fileExists(pathFileName)) {
            ret = pathFileName
            return true            
        }
    });

    return ret
}

export const unzip = (zipPath: string, unzipToDir: string) => {
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

								const filename = path.join(unzipToDir, entry.fileName)
                                const file = fs.createWriteStream(filename);
                                readStream.pipe(file);
                                file.on('finish', () => {
                                    // Wait until the file is finished writing, then read the next entry.
                                    // @ts-ignore: Typing for close() is wrong.
                                    file.close(() => {
										fs.chmod(filename, (entry.externalFileAttributes >> 16) & 0o7777, (err) => { });
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