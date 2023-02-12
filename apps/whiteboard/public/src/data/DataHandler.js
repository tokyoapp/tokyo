import ImageFile from "./files/ImageFile.js";
import ImageURL from "../ImageURL.js";
import Notification from "../components/Notification.js";
import CDRFile from "./files/CDRFile.js";
import AIFile from "./files/AIFile.js";

const types = new Set([
    ImageFile,
    CDRFile,
    AIFile
]);

export class DataHandler {

    static enableDragAndDrop() {
        let entered = false;

        window.addEventListener('drop', e => {
            e.preventDefault();
            DataHandler.handleFiles(e.dataTransfer.files, e);
            DataHandler.handleItems([ e.dataTransfer.items[0] ]);
        });

        window.addEventListener('dragenter', e => {
            entered = true;
        });

        window.addEventListener('dragover', e => {
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

    static importFiles(files) {
        for(let file of files) {
            this.handleFiles([ file ], files);
        }
    }

    static async handleFiles(files) {
        for(let file of files) {
            const FileType = this.resolveFileType(file);
            if(FileType) {
                const read = await FileType.read(file);
                if(read) {
                    const canvas = document.querySelector('canvas-element');
                    const uri = await read.getImage();
                    const node = canvas.canvas.createNode(uri);
                    const element = canvas.canvas.getNodeElement(node);
                    element.originalName = file.name;
                    node.position[0] = canvas.pointer.canvasX;
                    node.position[1] = canvas.pointer.canvasY;
                }
                // handle all files
                // break;
            } else {
                console.error('File type not handled');
                new Notification({ text: "Filetype not supported" }).show()
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
            const url = new ImageURL(uri);
            const canvas = document.querySelector('canvas-element');
            const node = canvas.canvas.createNode(url.getImageUrl());
            node.position[0] = canvas.pointer.canvasX;
            node.position[1] = canvas.pointer.canvasY;
        } catch(err) {
            console.error(err);
            throw new Error(err);
        }
    }
}
