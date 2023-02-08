import Notification from "./components/Notification.js";
import { donwloadToDataUri } from "./utils.js";

export default class Canvas {

    constructor(saveData) {

        this.history = [];
        this.historyPointer = 0;
        this.historySize = 25;

        if(saveData) {
            this.asset = saveData.asset;
            this.canvas = saveData.canvas;
            this.nodes = saveData.nodes || [];
            this.elements = saveData.elements || [];
            this.lines = saveData.lines || [];
        } else {
            this.asset = {
                "version": "1.0",
                "generator": "whiteboard",
                "copyright": "2020 (c) Tim Havlicek"
            };
            this.canvas = {
                "title": "",
                "view": [0, 0],
                "scale": 0.5
            };
            this.nodes = [];
            this.elements = [];
            this.lines = [];
        }

        for(let element of this.elements) {
            element.image = new Image();
            if(element.data.match('http')) {
                donwloadToDataUri(element.data).then(uri => {
                    element.image.src = uri;
                });
            } else {
                element.image.src = element.data;
            }
        }

        this.pushToHistory();
    }

    pushToHistory() {
        if(this.historyPointer === 0) {
            this.history.unshift(JSON.stringify({
                nodes: this.nodes,
                lines: this.lines
            }));
        } else {
            const newHistory = this.history.slice(this.historyPointer);
            this.history = newHistory;
            this.historyPointer = 0;
        }

        if(this.history.length > this.historySize) {
            this.history.pop();
        }
    }

    clearHistory() {
        this.history = [];
    }

    stepBack() {
        this.historyPointer = Math.max(0, Math.min(this.history.length-1, this.historyPointer + 1));
        const state = this.history[this.historyPointer];
        const json = JSON.parse(state);
        this.nodes = json.nodes;
        this.lines = json.lines;
    }

    stepForward() {
        this.historyPointer = Math.max(0, Math.min(this.history.length-1, this.historyPointer - 1));
        const state = this.history[this.historyPointer];
        const json = JSON.parse(state);
        this.nodes = json.nodes;
        this.lines = json.lines;
    }

    deleteNode(node) {
        this.nodes.splice(this.nodes.indexOf(node), 1);
    }

    createNode(dataUrl) {
        const element = {
            data: dataUrl,
            image: new Image(),
            type: "image/jpg",
        }
        const node = {
            element: this.elements.push(element)-1,
            position: [0, 0],
            size: [100, 100],
            scale: 1
        }
        element.image.onload = () => {
            node.size[0] = element.image.width;
            node.size[1] = element.image.height;

            this.nodes.push(node);
        }
        element.image.onerror = (e) => {
            console.error(e);
            new Notification({ text: 'Could not load image.' }).show();
        }
        
        if(dataUrl.match('http')) {
            donwloadToDataUri(dataUrl).then(uri => {
                element.image.src = uri;
            })
        } else {
            element.image.src = dataUrl;
        }
        
        return node;
    }

    createTextNode(text) {
        const element = {
            data: text,
            type: "text/plain",
        }
        const node = {
            element: this.elements.push(element)-1,
            position: [0, 0],
            size: [1000, 500],
            scale: 1,
            extras: {
                'font-family': 'Roboto',
                'font-size': "69px",
                'color': "#eee",
            },
        }
        this.nodes.push(node);
        return node;
    }

    getNodeElement(node) {
        return this.elements[node.element];
    }

    toJsonString() {
        return JSON.stringify({
            asset: this.asset,
            canvas: this.canvas,
            nodes: this.nodes,
            elements: this.elements,
            lines: this.lines,
        })
    }

    getNodeBounds(nodes) {
        const globalMinMaxX = [Infinity, -Infinity];
        const globalMinMaxY = [Infinity, -Infinity];

        for(let node of nodes) {
            globalMinMaxX[0] = Math.min(globalMinMaxX[0], node.position[0]);
            globalMinMaxY[0] = Math.min(globalMinMaxY[0], node.position[1]);
            
            globalMinMaxX[1] = Math.max(globalMinMaxX[1], node.position[0] + node.size[0]);
            globalMinMaxY[1] = Math.max(globalMinMaxY[1], node.position[1] + node.size[1]);
        }

        return {
            minX: globalMinMaxX[0],
            maxX: globalMinMaxX[1],
            minY: globalMinMaxY[0],
            maxY: globalMinMaxY[1],
            width: globalMinMaxX[1] - globalMinMaxX[0],
            height: globalMinMaxY[1] - globalMinMaxY[0],
            originX: (globalMinMaxX[1] + globalMinMaxX[0]) / 2,
            originY: (globalMinMaxY[1] + globalMinMaxY[0]) / 2,
        }
    }

}