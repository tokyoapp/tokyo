import { bytesToBase64 } from "../lib/base64.js";
import Notification from "./components/Notification.js";

export function dragElement(ele, callback) {

    let lastEvent = null;
    let dragging = false;

    let state = null;
    let pointers = {};

    ele.addEventListener('pointerdown', e => {
        dragging = true;
        lastEvent = e;

        pointers[e.pointerId] = e;

        state = {
            button: e.button,
            x: e.x,
            y: e.y,
            delta: [ 0, 0 ],
            absolute: [ 0, 0 ],
            mousedown: true,
            mouseup: false,
            target: e.target,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            shiftKey: e.shiftKey,
            pressure: 1.0
        }

        callback(state);
    });

    window.addEventListener('pointerup', e => {
        if(dragging) {
            dragging = false;
            lastEvent = null;

            state.x = e.x;
            state.y = e.y;
            state.mousedown = false;
            state.mouseup = true;
            state.target = e.target;

            callback(state);
        }

        delete pointers[e.pointerId];
    });

    window.addEventListener('pointermove', e => {
        if(dragging && lastEvent) {

            state.x = e.x;
            state.y = e.y;
            state.delta = [ 
                e.movementX, 
                e.movementY
            ];
            state.absolute = [ 
                lastEvent.x - e.x, 
                lastEvent.y - e.y
            ];
            state.mousedown = false;
            state.mouseup = false;
            state.target = e.target;
            state.ctrlKey = e.ctrlKey;
            state.altKey = e.altKey;
            state.shiftKey = e.shiftKey;
            state.pressure = e.pressure;
            state.type = e.pointerType;
            state.pointerId = e.pointerId;
            
            callback(state);
        }
    });
}

export function multiplyByMatrix(vec, matrix) {
    return [
        matrix[0][0] * vec[0] + matrix[0][1] * vec[0] + matrix[0][2] * vec[0],
        matrix[1][0] * vec[1] + matrix[1][1] * vec[1] + matrix[1][2] * vec[1],
        matrix[2][0] * vec[2] + matrix[2][1] * vec[2] + matrix[2][2] * vec[2],
    ]
}

export function donwloadToDataUri(url) {
    return fetch(url).then(res => res.blob()).then(blob => {
        return blobToUri(blob);
    })
}

export async function blobToUri(blob) {
    const buffer = await blob.arrayBuffer();
    const view = new Uint8Array(buffer);
    if(view.byteLength == 0) {
        console.log('CORS Error');
        return null;
    }
    const base64 = bytesToBase64(view);
    const uri = 'data:image/jpg;base64,' + base64;
    return uri;
}

export async function fileToUri(file) {
    const buffer = await file.arrayBuffer();
    const view = new Uint8Array(buffer);
    const base64 = bytesToBase64(view);
    const uri = 'data:image/jpg;base64,' + base64;
    return uri;
}

export async function downloadCanvas(canvas, filename) {
    const a = document.createElement('a');
    a.download = filename || "Image.png";
    a.href = canvas.toDataURL();
    a.click();
}

export function debounce(callback = () => {}, rate = 500) {
    let timer = 0, qued = false;

    return (...args) => {
        if(timer === 0) {
            timer = rate;

            callback(...args);

            setTimeout(() => {
                if(qued) callback(...args);
                qued = false;
                timer = 0;
            }, rate);
        } else {
            qued = true;
        }
    }
}

export function resizeCanvas(canvas, newWidth, newHeight) {
    const tempCanvas = document.createElement('canvas');
    if(newHeight) {
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
    } else {
        const ar = canvas.width / canvas.height;
        tempCanvas.width = newWidth;
        tempCanvas.height = newWidth / ar;
    }

    const ctxt = tempCanvas.getContext("2d");
    ctxt.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, tempCanvas.width, tempCanvas.height);

    return tempCanvas;
}

export function bitmapToBlob(bitmap) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctxt = canvas.getContext("2d");
        ctxt.drawImage(bitmap, 0, 0);
        canvas.toBlob(blob => {
            resolve(blob);
        })
    })
}

export function bitmapToURI(bitmap) {
    return new Promise(async (resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctxt = canvas.getContext("2d");
        ctxt.drawImage(bitmap, 0, 0);
        resolve(await canvas.toDataURL());
    })
}

export function formatDateTimeString(time) {
    if(time) {
        const date = new Date(time);
        return `${date.toDateString()} ${date.toLocaleTimeString()}`;
    }
}

function componentToHex(c) {
    const hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  
export function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// https://gist.github.com/mjackson/5311256
export function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return [ Math.floor(h * 100), Math.floor(s * 100), Math.floor(l * 100) ];
}