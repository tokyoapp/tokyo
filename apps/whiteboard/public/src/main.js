import CanvasElement from './components/canvas/CanvasElement.js';
import Canvas from './Canvas.js';
import { DataHandler } from './data/DataHandler.js';
import FileSystem from './data/FileSystem.js';
import HomeElement from './components/Home.js';
import Preferences from './app/Preferences.js';
import { blobToUri, downloadCanvas, fileToUri, resizeCanvas } from './utils.js';
import Notification from './components/Notification.js';
import { Action } from './input/Actions.js';

Preferences.listen('theme', () => {
    if(Preferences.get('theme') == "light") {
        document.querySelector('html').setAttribute('lighttheme', '');
    } else {
        document.querySelector('html').removeAttribute('lighttheme');
    }
});

Action.register({
    name: "Save",
    description: "Save Whiteboard",
    shortcut: "Ctrl+S",
    onAction: (args, event, action) => {
        saveFile();
        event.preventDefault();
    }
});

Preferences.default('theme', 'dark');

let canvas;

window.addEventListener('DOMContentLoaded', init);

let file_ref;

FileSystem.connectToDatabase();

window.openFileRef = async fileRef => {
    const string = await (await fileRef.getFile()).text();
    const json = JSON.parse(string);
    const loadedCanvas = new Canvas(json);
    canvas.setCanvas(loadedCanvas);
    file_ref = fileRef;
}

async function openFile() {
    file_ref = await FileSystem.openFileChooser({
        multiple: false,
        types: [{ description: 'Whiteboards', accept: { 'application/json': ['.whiteboard'] } }],
        suggestedStartLocation: 'whtieboards'
    });
    if (!file_ref)
        return;

    window.openFileRef(file_ref);
}

async function saveCurrentFile() {
    if (file_ref) {
        const write_file_ref = await file_ref.createWritable();
        const save = canvas.canvas.toJsonString();
        await write_file_ref.write(save);
        await write_file_ref.close();
        console.log('Saved file');
        new Notification({ text: 'Saved file' }).show();

        let preview = canvas.drawPreview();
        preview = resizeCanvas(preview, 480);
        const bitmap = await createImageBitmap(preview);
        FileSystem.saveFilePreview(file_ref.name, bitmap);
    }
}

async function saveFile() {
    if(!canvas.canvas.canvas.title) {
        canvas.canvas.canvas.title = prompt("Title");
    }

    if(file_ref) {
        await saveCurrentFile();
    } else {
        await saveAs();
    }
}

async function saveAs() {
    const dir_ref = await self.showDirectoryPicker();
    if (!dir_ref) {
        return;
    }

    const fileName = canvas.canvas.canvas.title.replace(" ", "-");
    const new_file = await dir_ref.getFileHandle(fileName + ".whiteboard", { create: true });

    file_ref = new_file;

    const new_file_writer = await new_file.createWritable();
    const save = canvas.canvas.toJsonString();
    await new_file_writer.write(save);
    await new_file_writer.close();
}

window.openFile = openFile;
window.saveFile = saveFile;

window.pasteImage = async () => {
    const data = await navigator.clipboard.read();
    const clipboardItem = data[0];

    const items = [];
    for (const type of clipboardItem.types) {
        const blob = await clipboardItem.getType(type);
        items.push(blob);
    }

    handleDataItems(items);    
}

window.importImage = () => {
    const input = document.createElement('input');
    input.type = "file";
    input.onchange = e => {
        handleDataItems(input.files);
    }
    input.click();
}

window.saveSnapshot = () => {
    const img = canvas.drawPreview();
    const fileName = canvas.canvas.canvas.title.replace(" ", "-");
    downloadCanvas(img, fileName);
}

window.onbeforeunload = function() {
    if(canvas.canvas.history.length > 1) {
        return "Close without saving?";
    }
}

window.addEventListener("blur", e => {
    saveCurrentFile();
});

window.openHome = () => {
    mainElement.appendChild(document.createElement('home-element'));
}

window.closeHome = () => {
    const home = document.querySelector('home-element');
    if(home) home.close();
}

window.newCanvas = async function() {
    if(file_ref || canvas.canvas.nodes.length > 0) {
        if(confirm("Save work?")) {
            await window.saveFile();
        }
    }
    file_ref = null;
    const loadedCanvas = new Canvas();
    canvas.setCanvas(loadedCanvas);
}

window.addEventListener("wheel", e => e.preventDefault(), { passive: false });

window.addEventListener('paste', async e => {
    handleDataItems(e.clipboardData.items);
});

async function handleDataItems(items) {
    for (let item of items) {
        let uri;

        if(item.kind == "file") {
            const file = item.getAsFile();
            uri = await fileToUri(file);

            if (uri) {
                const node = canvas.canvas.createNode(uri);
                node.position[0] = canvas.pointer.canvasX;
                node.position[1] = canvas.pointer.canvasY;
            }

        } else if (item instanceof File) {
            DataHandler.importFiles([item]);
            
        } else if (item instanceof Blob) {
            if (item.type.match("image")) {
                const uri = await blobToUri(item);
                const node = canvas.canvas.createNode(uri);
                node.position[0] = canvas.pointer.canvasX;
                node.position[1] = canvas.pointer.canvasY;

            } else if (item.type.match("text/plain")) {
                const str = await item.text();
                DataHandler.handleUrl(str);
            }

        } else {
            if(item.type != "text/html") {
                item.getAsString(uri => {
                    try {
                        DataHandler.handleUrl(uri);
                    } catch(err) {
                        const node = canvas.canvas.createTextNode(uri);
                        node.position[0] = canvas.pointer.canvasX;
                        node.position[1] = canvas.pointer.canvasY;
                    }
                });
            }
        }
    }
    
    canvas.canvas.pushToHistory();
}

async function init() {
    canvas = document.querySelector('canvas-element');
    DataHandler.enableDragAndDrop();

    if(!Preferences.get('hide-home')) {
        FileSystem.onReady(() => {
            FileSystem.getFileList().then(list => {
                if(list.length > 0) {
                    const home = new HomeElement();
                    mainElement.appendChild(home);
                }
            })
        })
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./sw.js').then(function (registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function (err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
