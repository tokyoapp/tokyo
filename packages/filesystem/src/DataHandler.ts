const types = [];

export default class DataHandler extends EventTarget {

    static registerFileType(fileType) {
        types.push(fileType);
    }

    static enableDragAndDrop(rootElement = window) {
        let entered = false;

        rootElement.addEventListener('drop', e => {
            e.preventDefault();
            DataHandler.handleFiles(e.dataTransfer.files, e);
            DataHandler.handleItems([ e.dataTransfer.items[0] ]);
        });

        rootElement.addEventListener('dragenter', e => {
            entered = true;
        });

        rootElement.addEventListener('dragover', e => {
            if(entered) e.preventDefault();
        });
    }

    static handledTypes() {
        return types;
    }

    static resolveFileType(file) {
        for(let type of types) {
            if(type.fileType && file.type.match(type.fileType)) {
                return type;
            } else {
                for(let fileEnding of type.fileEndings) {
                    if(file.name.match(fileEnding)) {
                        return type;
                    }
                }
            }
        }
        return null;
    }

    static async handleFiles(files) {
        for(let file of files) {
            const FileType = this.resolveFileType(file);
            if(FileType) {
                const read = await FileType.read(file);
                if(read) {
                    this.dispatchEvent(new FileImportEvent(read));
                }
                // handle all files
                // break;
            } else {
                console.error('File type not handled');
                new Gyro.Notification({ text: "Filetype not supported" }).show()
            }
        }
    }

    static handleItems(items) {
        for(let item of items) {
            item.getAsString(url => {
                DataHandler.handleUrl(url);
            })
        }
    }

    static handleUrl(uri) {
        try {
            const url = uri;
            // do something with url
        } catch(err) {
            console.error(err);
            throw new Error(err);
        }
    }
}

class FileImportEvent extends Event {

    file: any;

    constructor(file) {
        super('file.imported');
        this.file = file;
    }
}
