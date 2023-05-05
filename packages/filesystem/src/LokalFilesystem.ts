let db: IDBDatabase;

const renderablefileTypes = [
    'image/jpeg',
    'image/png',
    'image/svg+xml',
]

interface FileRef {
    id: string,
    created: number,
    lastOpened: number,
    preview?: ImageBitmap,
    file: File,
}

interface FileRefPreview {
    id: string,
    created: number,
    lastOpened: number,
    preview?: ImageBitmap,
}

interface FilePickerOptions {
    types?: Array<any>,
    excludeAcceptAllOption?: Boolean,
    multiple?: Boolean
}

declare global {
    var showOpenFilePicker: Function
}

export default class LokalFilesystem {

    // open files with handles or fallback to lagecy file input
    // file handles can be used ->
    // - provide a list of recently opened files
    // - reopen recently opened files wihtout selecting them in the file chooser
    // - optionally render file previews

    static async connectToDatabase() {
        if (!db) {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open("FileSystemDatabase");
                request.onerror = (e: Event) => {
                    console.error(e);
                    reject();
                }
                request.onsuccess = (e: Event) => {
                    db = request.result;
                    resolve(db);
                }
                request.onupgradeneeded = (e: Event) => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('filerefs')) {
                        db.createObjectStore("filerefs", { keyPath: 'id' });
                    }
                }
            })
        }
        return db;
    }

    static renderFilePreview(file: File): Promise<ImageBitmap | undefined> {
        return new Promise((resolve, reject) => {
            if (renderablefileTypes.indexOf(file.type) !== -1) {
                const src = URL.createObjectURL(file);
                const img = new Image();

                img.onload = async () => {
                    const cnvs = document.createElement('canvas');
                    cnvs.width = 256;
                    cnvs.height = 256;
                    const ctxt = cnvs.getContext("2d");
                    const ar = img.width / img.height;
                    const w = 256 * ar;
                    const h = 256;
                    ctxt?.drawImage(img, 0, 0, img.width, img.height, (256 / 2) - (w / 2), 0, w, h);
                    resolve(await createImageBitmap(cnvs));
                }
                img.onerror = () => {
                    reject(new Error('failed rendering preview'));
                }

                img.src = src;
            } else {
                console.log(file);
                resolve(undefined);
            }
        })
    }

    static async openDirectoryChooser(): Promise<Array<any>> {
        await this.connectToDatabase();

        const dirs = [];

        if ("showDirectoryPicker" in window) {
            // file handles
            const directory_ref = await window.showDirectoryPicker();

            dirs.push(directory_ref);

            const dir_id = directory_ref.name;

            if (!(await this.getFileById(dir_id))) {
                let transaction = db.transaction(["filerefs"], "readwrite");
                const data: FileRef = {
                    id: dir_id,
                    created: Date.now(),
                    lastOpened: Date.now(),
                    preview: undefined,
                    file: directory_ref,
                }
                let request = transaction.objectStore("filerefs").add(data);
                request.onerror = (e) => {
                    throw new Error('Error openeing file: ' + request.error);
                }
            }

        } else {
            // fallback to legacy
        }

        return dirs;
    }

    static async openFileChooser(options: FilePickerOptions = {
        multiple: false,
        excludeAcceptAllOption: false,
        types: []
    }): Promise<Array<File>> {

        await this.connectToDatabase();

        if ("showOpenFilePicker" in window) {
            // file handles
            const file_ref_list = await window.showOpenFilePicker(options);
            const files = [];

            for (let file_ref of file_ref_list) {
                const file_id = file_ref.name;
                const fileObject = await file_ref.getFile();

                const preview = await this.renderFilePreview(fileObject);

                files.push(fileObject);

                if (!(await this.getFileById(file_id))) {
                    let transaction = db.transaction(["filerefs"], "readwrite");
                    const data: FileRef = {
                        id: file_id,
                        created: Date.now(),
                        lastOpened: Date.now(),
                        preview: preview,
                        file: file_ref,
                    }
                    let request = transaction.objectStore("filerefs").add(data);
                    request.onerror = (e) => {
                        throw new Error('Error openeing file: ' + request.error);
                    }
                } else {
                    if (preview) {
                        this.saveFilePreview(file_id, preview);
                    }
                }
            }

            return files;
        } else {
            return new Promise((resolve, reject) => {
                // use lagecy file input
                const input = document.createElement('input');
                input.type = "file";

                if (options.multiple) {
                    input.multiple = true;
                }

                if (options.types) {
                    let accepts = [];
                    for (let type of options.types) {
                        const accept = type.accept;
                        for (let key of Object.keys(accept)) {
                            const extensionsList = accept[key];
                            accepts.push(...extensionsList);
                        }
                    }

                    input.accept += accepts.join(', ');
                }

                input.onchange = e => {
                    const files = [];
                    if (input.files) {
                        files.push(...input.files);
                    }
                    resolve(files);
                }
                input.onerror = e => {
                    console.error(e);
                }

                input.click();
            })
        }
    }

    static async saveFilePreview(fileId: string, previewImage: ImageBitmap) {
        await this.connectToDatabase();

        let transaction = db.transaction(["filerefs"], "readonly");
        let request = transaction.objectStore("filerefs").get(fileId);
        request.onsuccess = async function (e) {
            const data = request.result;
            data.preview = previewImage;

            let transaction = db.transaction(["filerefs"], "readwrite");
            let request2 = transaction.objectStore("filerefs").put(data);
            request2.onerror = function (e) {
                console.error(e);
            }
        }
    }

    static async getFilePreview(fileId: string): Promise<ImageBitmap | null | undefined> {
        return this.getFileById(fileId).then(data => {
            if (data) {
                return data.preview;
            }
        });
    }

    static async getFileById(fileId: string): Promise<FileRef | undefined> {
        await this.connectToDatabase();

        return new Promise((resolve, reject) => {
            let transaction = db.transaction(["filerefs"], "readonly");
            let request = transaction.objectStore("filerefs").get(fileId);
            request.onsuccess = async function (e) {
                const data = request.result;
                if (data) {
                    if(data.file instanceof FileSystemFileHandle) {
                        data.file = await data.file.getFile();
                    } else {
                        const entries = data.file.entries();
                        console.log([...entries]);
                    }
                    console.log(data);
                    resolve(data);
                } else {
                    resolve(undefined);
                }
            }
            request.onerror = err => {
                throw new Error('error getting file')
            };
        })
    }

    static async getFileList(): Promise<Array<FileRefPreview>> {
        await this.connectToDatabase();

        return new Promise((resolve, reject) => {
            let transaction = db.transaction(["filerefs"], "readwrite");
            let request = transaction.objectStore("filerefs").getAll();
            request.onsuccess = (e: Event) => {
                resolve(request.result)
            };
            request.onerror = (e: Event) => {
                console.error(e);
                reject();
            };
        })
    }

    static async openFileById(file_id: string): Promise<File> {
        await this.connectToDatabase();

        return new Promise((resolve, reject) => {
            let transaction = db.transaction(["filerefs"], "readonly");
            let request = transaction.objectStore("filerefs").get(file_id);
            request.onsuccess = async function (e) {
                const fileRef = request.result;
                fileRef.lastOpened = Date.now();

                // update last opened entry
                let transaction = db.transaction(["filerefs"], "readwrite");
                let request2 = transaction.objectStore("filerefs").put(fileRef);
                request2.onerror = function (e) {
                    console.error(e);
                    reject();
                }

                const ref = fileRef.file;

                if (await ref.requestPermission() != 'granted') {
                    reject();
                }

                if(ref instanceof FileSystemFileHandle) {
                    resolve(await ref.getFile());
                } else if(ref instanceof FileSystemDirectoryHandle) {
                    resolve(ref);
                }
            }
            request.onerror = err => reject(err);
        })
    }

    static async removeFileById(file_id = "123") {
        await this.connectToDatabase();

        return new Promise((resolve, reject) => {
            let transaction = db.transaction(["filerefs"], "readwrite");
            let request = transaction.objectStore("filerefs").delete(file_id);
            request.onsuccess = async function (e) {
                resolve(true);
            }
            request.onerror = async function (e) {
                reject();
            }
        });
    }

}
