import { html, render } from 'https://unpkg.com/lit-html@1.3.0/lit-html.js';
import Notification from '../Notification.js';
import { bitmapToBlob, debounce, donwloadToDataUri, dragElement, multiplyByMatrix, rgbToHex, rgbToHsl } from '../../utils.js';
import Canvas from '../../Canvas.js';
import { Action } from '../../input/Actions.js';
import Preferences from '../../app/Preferences.js';
import CanvasRenderer from '../../CanvasRenderer.js';
import './Toolbar.js';
import { CanvasOverlayElement } from './CanvasOverlayElement.js';
import { ContextMenu } from './ContextMenu.js';
import TextNode from './nodes/TextNode.js';
import ImageNode from './nodes/ImageNode.js';
import Pen from './tools/Pen.js';
import Select from './tools/Select.js';

const renderer = new CanvasRenderer();

Preferences.default('resolution-preview', false);

const NODE_TYPES = {
    "text/plain": TextNode,
    "image/jpg": ImageNode,
    "image/png": ImageNode,
    "image/webp": ImageNode,
    "image/gif": ImageNode
}

const TOOLS = [
    Select,
    Pen,
]

const TOOLS_MAP = {
    'select': Select,
    'pen': Pen,
}

export default class CanvasElement extends HTMLElement {

    setCanvas(canvas) {
        this.canvas = canvas;
    }

    constructor() {
        super();

        this.canvas = new Canvas();
        this.canvasElement = document.createElement("canvas");
        this.context = this.canvasElement.getContext("2d");
        this.selection = [];
        this.pointer = {
            x: 0,
            y: 0,
            selection: [
                [0, 0],
                [0, 0],
            ],
            selecting: false,
            scaleCorner: false,
            colorPicker: false,
            deleteCorner: false,
            scaling: false,
            zoomImage: false,
            moveCanvas: false,
            brushSize: 20,
            focusedElement: null,
            color: null,
            node: null,
            lastNode: null,
        }

        this.activeTool = 0;
        this.lastUsedTool = null;

        this.currentScale = 0.1;
        this.scaleCornerSize = 30;
        this.gridSize = 100;
        this.colors = {
            line_color: '#eee',
            grid_1: '#171717',
            grid_2: "#101010",
            selection_border: "#333",
            selection_background: "#33333333",
        }
        this.uiElements = {};

        Preferences.listen('theme', () => {
            const theme = Preferences.get('theme');
            if(theme == "light") {
                this.colors = {
                    line_color: '#eee',
                    grid_1: '#eee',
                    grid_2: "#fff",
                    selection_border: "#333",
                    selection_background: "#33333333",
                }
            } else {
                this.colors = {
                    line_color: '#eee',
                    grid_1: '#171717',
                    grid_2: "#101010",
                    selection_border: "#333",
                    selection_background: "#33333333",
                }
            }
        });

        this.tabIndex = 0;

        this.attachShadow({ mode: 'open' });

        // contextMenu
        let ctxtMenuStartPos = [0, 0];
        this.canvasElement.addEventListener('mousedown', e => {
            ctxtMenuStartPos[0] = e.x;
            ctxtMenuStartPos[1] = e.y;
        });

        const menu = new ContextMenu({
            items: [
                { title: 'Create Text Element', action: () => {
                    const node = this.canvas.createTextNode("Text");
                    node.position[0] = this.pointer.canvasX;
                    node.position[1] = this.pointer.canvasY;
                } },
                { title: 'Import Image', action: () => {
                    window.importImage();
                } },
                { title: 'Paste', action: () => {
                    window.pasteImage();
                } }
            ]
        });
        document.body.appendChild(menu);

        this.canvasElement.oncontextmenu = e => {
            if(ctxtMenuStartPos[0] == e.x && ctxtMenuStartPos[1] == e.y) {
                menu.setPosition(e.x, e.y);
                e.preventDefault();
            } else {
                e.preventDefault();
            }
        }
        // contextMenu end

        window.addEventListener('resize', this.resize.bind(this));

        this.canvasElement.addEventListener('wheel', e => {
            this.setScale(this.canvas.canvas.scale - ((e.deltaY * this.canvas.canvas.scale) * 0.001));
        });

        // input actions
        Action.register({
            name: "Delete",
            description: "Delete Nodes",
            shortcut: "Delete",
            onAction: (args, event, action) => {
                for(let node of this.lastLastSelection) {
                    this.deleteNode(node);
                }
                this.canvas.pushToHistory();
            }
        });
        Action.register({
            name: "Undo",
            description: "Step Backwards",
            shortcut: "Ctrl+Z",
            onAction: (args, event, action) => {
                this.canvas.stepBack();
            }
        });
        Action.register({
            name: "Redo",
            description: "Step Forwards",
            shortcut: "Ctrl+Y",
            onAction: (args, event, action) => {
                this.canvas.stepForward();
            }
        });
        Action.register({
            name: "Select All",
            description: "Select all nodes",
            shortcut: "Ctrl+A",
            onAction: (args, event, action) => {
                this.selection = [...this.canvas.nodes];
            }
        });
        Action.register({
            name: "Copy",
            description: "Copy Image",
            shortcut: "Ctrl+C",
            onAction: (args, event, action) => {
                const exec = async () => {
                    const items = [];
                    for(let node of this.lastLastSelection) {
                        const element = this.canvas.getNodeElement(node);
                        const blob = await bitmapToBlob(element.image);
                        items.push(new ClipboardItem({ "image/png": blob }));
                    }

                    navigator.clipboard.write(items);
                }

                exec();
            }
        });
        Action.register({
            name: "FullsizeImage",
            description: "Show image but bigger",
            shortcut: "F",
            hold: true,
            onAction: (args, event, action) => {
                this.pointer.zoomImage = action.state;
            }
        });
        Action.register({
            name: "MoveCanvas",
            description: "Use hand tool",
            shortcut: " ",
            hold: true,
            onAction: (args, event, action) => {
                this.pointer.moveCanvas = action.state;
                if(action.state) {
                    this.canvasElement.style.cursor = "grab";
                } else {
                    this.canvasElement.style.cursor = "";
                }
            }
        });
        Action.register({
            name: "PenTool",
            description: "Use draw tool",
            shortcut: "b",
            hold: true,
            onAction: (args, event, action) => {
                this.pointer.drawTool = action.state;
                if(action.state) {
                    this.canvasElement.style.cursor = "url(./images/pen.svg), auto";
                } else {
                    this.canvasElement.style.cursor = "";
                }
            }
        });
        Action.register({
            name: "EreserTool",
            description: "Use ereser tool",
            shortcut: "Shift",
            hold: true,
            onAction: (args, event, action) => {
                if(TOOLS[this.activeTool] == TOOLS_MAP['pen']) {
                    this.pointer.drawTool = action.state;
                    if(!this.pointer.moveCanvas) {
                        this.pointer.eraser = action.state;
                    }
                    if(action.state) {
                        this.canvasElement.style.cursor = makeBrushCursor(this.pointer.brushSize);
                    } else {
                        this.canvasElement.style.cursor = "";
                    }
                }
            }
        });
        Action.register({
            name: "ColorPickerTool",
            description: "Use color picker tool",
            shortcut: "C",
            hold: true,
            onAction: (args, event, action) => {
                this.pointer.colorPicker = action.state;
                if(action.state) {
                    this.colorPickerInterval = setInterval(() => {
                        if(this.pointer.color) {
                            const uri = makeColorPickerCursor(this.pointer.color);
                            this.canvasElement.style.cursor = uri;
                        }
                    }, 1000 / 24);
                } else {
                    clearInterval(this.colorPickerInterval);
                    this.canvasElement.style.cursor = "";
                }
            }
        });

        Action.register({
            name: "TouchZoom",
            shortcut: "Pinch",
            onAction: (args, event, action) => {
                const delta = -action.state.pinch;
                this.setScale(this.canvas.canvas.scale - ((delta * this.canvas.canvas.scale) * 0.001));
            }
        });
        Action.register({
            name: "TouchMove",
            shortcut: "Pan",
            onAction: (args, event, action) => {
                this.moveCanvas(action.state.delta);
            }
        });

        // Arrowkey node movement
        this.addEventListener('keydown', e => {
            // input for text elements
            if(this.pointer.focusedElement) {
                const element = this.canvas.getNodeElement(this.pointer.focusedElement);
                if(element && element.type == "text/plain") {
                    if(e.key.length > 1) {
                        switch(e.key) {
                            case 'Backspace':
                                element.data = element.data.slice(0, element.data.length-1);
                                break;
                            default:
                                break;
                        }
                    } else {
                        element.data += e.key;
                    }
                    return;
                }
            }

            // global key controls
            let index = 1;
            let dir = 1;

            const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
            switch(e.key) {
                case "ArrowUp":
                    index = 1;
                    dir = -1;
                    break;
                case "ArrowDown":
                    index = 1;
                    dir = 1;
                    break;
                case "ArrowLeft":
                    index = 0;
                    dir = -1;
                    break;
                case "ArrowRight":
                    index = 0;
                    dir = 1;
                    break;
            }

            if(keys.indexOf(e.key) !== -1) {
                for(let node of this.lastLastSelection) {
                    if(e.shiftKey) {
                        node.position[index] += (10 / this.currentScale) * dir;
                    } else {
                        node.position[index] += (1 / this.currentScale) * dir;
                    }
                }
            }
        });
        window.addEventListener('pointerup', e => {
            if(this.pointer.deleteCorner) {
                for(let node of this.selection) {
                    this.deleteNode(node);
                }
            }
            if(this.pointer.colorPicker && this.pointer.color) {
                const hex = rgbToHex(...this.pointer.color);
                navigator.clipboard.writeText(hex);
                new Notification({ text: 'Color copied.' }).show()
            }
        });

        const pickColorDebounced = debounce(e => {
            this.pointer.color = this.pickColor(this.pointer.x, this.pointer.y);
            this.style.setProperty('--colorPicker-color', `
                rgb(${this.pointer.color[0]}, ${this.pointer.color[1]}, ${this.pointer.color[2]})
            `);
        }, 200);

        this.canvasElement.addEventListener('pointermove', e => {
            this.pointer.x = e.x;
            this.pointer.y = e.y;
            const conv = this.viewToCanvas(e.x, e.y);
            this.pointer.canvasX = conv[0];
            this.pointer.canvasY = conv[1];
            
            if(this.pointer.colorPicker) {
                pickColorDebounced(e);
            }
        });

        this.canvasElement.addEventListener('dragover', e => {
            const conv = this.viewToCanvas(e.x, e.y);
            this.pointer.canvasX = conv[0];
            this.pointer.canvasY = conv[1];
        });

        this.canvasElement.addEventListener('dblclick', e => {
            const node = this.hitTestNode(e.x, e.y);
            if(node) {
                this.bringNodeToFront(node);
            }
        });

        dragElement(this.canvasElement, this.handleMouseInput.bind(this));

        this.update();
    }

    deleteNode(node) {
        const id = node.element;
        this.canvas.deleteNode(node);

        // update ui
        if(id in this.uiElements) {
            this.uiElements[id].remove();
            this.uiElements[id] = null;
        }
    }

    getNodeType(node) {
        const element = this.canvas.getNodeElement(node);
        return NODE_TYPES[element.type];
    }

    setActiveTool(toolIndex) {
        if(TOOLS[toolIndex]) {
            this.lastUsedTool = this.activeTool;
            this.activeTool = toolIndex;
        }
    }

    handleMouseInput(data) {
        // redirect to tools
        if(data.button === 0) {
            const tool = TOOLS[this.activeTool];

            const currentNode = this.pointer.node;
            const lastNode = this.pointer.lastNode;
            const focusedNode = this.pointer.focusedElement;
            
            if(tool) {
                if(data.mousedown) {
                    if(currentNode && focusedNode != currentNode) {
                        const NodeType = this.getNodeType(currentNode);
                        NodeType.onFocus(this, currentNode);
                    }
                    if(currentNode !== lastNode && focusedNode == lastNode && lastNode) {
                        const NodeType = this.getNodeType(lastNode);
                        NodeType.onBlur(this, lastNode);
                    }

                    tool.onMouseDown(this, data);

                } else if(data.mouseup) {
                    tool.onMouseUp(this, data);

                } else {
                    tool.onMouseDrag(this, data);
                }
            } else {
                console.error('No tool selected');
            }
        }

        // global tool
        if(data.button !== 0) {
            if(data.button === 1 || data.button === 2 || 
                (this.pointer.moveCanvas && data.button === 0)) {

                // (not mbtn 0) or (move canvas(from pressing space) and mbtn 0)
                this.moveCanvas(data.delta);
            }
        }
    }

    moveCanvas(delta) {
        this.canvas.canvas.view[0] += delta[0] / this.currentScale;
        this.canvas.canvas.view[1] += delta[1] / this.currentScale;
    }

    addSelection(node) {
        if(this.selection.indexOf(node) === -1) {
            this.selection.push(node);
        }
    }

    removeSelection(node) {
        if(this.selection.indexOf(node) !== -1) {
            this.selection.splice(this.selection.indexOf(node), 1);
        }
    }

    evaluatePointerSelection() {
        for(let node of [...this.canvas.nodes]) {

            const p1 = [ node.position[0], node.position[1] ];
            const p2 = [ node.position[0] + node.size[0], node.position[1] ];
            const p3 = [ node.position[0] + node.size[0], node.position[1] + node.size[1] ];
            const p4 = [ node.position[0], node.position[1] + node.size[1] ];

            const selection = this.pointer.selection;

            let selectionP1 = this.viewToCanvas(...selection[0]);
            let selectionP2 = this.viewToCanvas(...selection[1]);

            if(selectionP1[0] > selectionP2[0]) {
                const temp = selectionP1;
                selectionP1 = selectionP2;
                selectionP2 = temp;
            }

            const check = pointsInRect([ p1, p2, p3, p4 ], [ selectionP1, selectionP2 ]);
            
            if(check) {
                this.addSelection(node);
            } else {
                this.removeSelection(node);
            }

            // check if every corner point of the node is inside the pointer selection rect
            // if true, push it to the selection
            //  also multi select notes with holding shift + click on nodes?
        }
    }

    get width() {
        return this.canvasElement.width;
    }
    get height() {
        return this.canvasElement.height;
    }

    bringNodeToFront(node) {
        const tempNode = this.canvas.nodes.splice(this.canvas.nodes.indexOf(node), 1);
        this.canvas.nodes.push(...tempNode);
    }

    setScale(scale) {
        this.canvas.canvas.scale = Math.max(0.01, scale);
    }

    hitTestNode(x, y) {
        // in canvas space
        const conv = this.viewToCanvas(x, y);
        x = conv[0];
        y = conv[1];

        const allNodes = [...this.canvas.nodes, ...this.selection];

        for(let node of allNodes.reverse()) {

            // scale corner
            const offset = this.scaleCornerSize / this.currentScale;
            this.pointer.scaleCorner = pointInRect(
                [x, y],
                [
                    node.position[0] + (node.size[0] - offset),
                    node.position[1] + (node.size[1] - offset),
                ],
                offset,
                offset
            );

            // delete corner
            this.pointer.deleteCorner = pointInRect(
                [x, y],
                [
                    node.position[0] + (node.size[0] - offset),
                    node.position[1],
                ],
                offset,
                offset
            );

            if(pointInRect(
                [x, y], 
                node.position, 
                node.size[0],
                node.size[1]
            )) {
                return node;
            }
        }
    }

    viewToCanvas(x, y) {
        // center
        x = x - this.width / 2;
        y = y - this.height / 2;

        // scale
        x = x / this.currentScale;
        y = y / this.currentScale;

        // offset view
        x = x - this.canvas.canvas.view[0];
        y = y - this.canvas.canvas.view[1];

        return [x, y];
    }

    canvasToView(x, y) {

        // offset view
        x = x + this.canvas.canvas.view[0];
        y = y + this.canvas.canvas.view[1];
        // scale
        x = x * this.currentScale;
        y = y * this.currentScale;
        // center
        x = x + this.width / 2;
        y = y + this.height / 2;

        return [x, y];
    }

    _drawGrid(ctxt) {
        const view = this.canvas.canvas.view;
        const maxX = (this.width + Math.abs(view[0])) / this.currentScale;
        const maxY = (this.height + Math.abs(view[1])) / this.currentScale;
        
        let size = this.gridSize;
        if(this.currentScale < 0.125) {
            size *= 2;
        }
        if(this.currentScale < 0.125 / 2) {
            size *= 3;
        }
        
        ctxt.strokeStyle = this.colors.grid_1;

        for(let x = 0; x < maxX; x+=size) {
            ctxt.moveTo(x, -maxY);
            ctxt.lineTo(x, maxY);
        }
        for(let x = 0; x > -maxX; x-=size) {
            ctxt.moveTo(x, -maxY);
            ctxt.lineTo(x, maxY);
        }

        for(let y = 0; y < maxY; y+=size) {
            ctxt.moveTo(-maxX, y);
            ctxt.lineTo(maxX, y);
        }
        for(let y = 0; y > -maxY; y-=size) {
            ctxt.moveTo(-maxX, y);
            ctxt.lineTo(maxX, y);
        }

        ctxt.stroke();

        // ctxt.beginPath();
        // ctxt.strokeStyle = this.colors.grid_2;
        // ctxt.moveTo(0, -maxY);
        // ctxt.lineTo(0, maxY);
        // ctxt.moveTo(-maxX, 0);
        // ctxt.lineTo(maxX, 0);

        // ctxt.stroke();
    }

    _drawUI(ctxt) {
        for(let node of this.canvas.nodes) {
            const element = this.canvas.getNodeElement(node);

            if(node === this.pointer.node) {
                ctxt.strokeStyle = this.colors.line_color;
                ctxt.lineWidth = (1 / this.currentScale);
                ctxt.strokeRect(
                    node.position[0] - 0.5,
                    node.position[1] - 0.5,
                    node.size[0],
                    node.size[1],
                );
            }

            if(this.pointer.focusedElement === node) {
                ctxt.strokeStyle = this.colors.line_color;
                ctxt.lineWidth = (1 / this.currentScale);
                ctxt.strokeRect(
                    node.position[0] - 0.5,
                    node.position[1] - 0.5,
                    node.size[0],
                    node.size[1],
                );

                // scale corner
                const csize = (this.scaleCornerSize / this.currentScale);
                const cx = node.position[0] + node.size[0] - csize;
                const cy = node.position[1] + node.size[1] - csize;

                ctxt.globalAlpha = 0.5;
                if(this.pointer.scaleCorner || this.pointer.scaling) {
                    ctxt.globalAlpha = 1;
                }
                
                const pad = 10 / this.currentScale;
                ctxt.lineWidth = (2 / this.currentScale);
                ctxt.beginPath();
                ctxt.moveTo(cx, cy + (csize - pad));
                ctxt.lineTo(cx + (csize - pad), cy + (csize - pad));
                ctxt.lineTo(cx + (csize - pad), cy);
                ctxt.stroke();

                ctxt.lineWidth = (2 / this.currentScale);

                ctxt.globalAlpha = 1;

                // delete corner
                ctxt.globalAlpha = 0.5;
                if(this.pointer.deleteCorner) {
                    ctxt.globalAlpha = 1;
                }

                ctxt.strokeStyle = this.colors.line_color;

                const dpad = 8 / this.currentScale;
                const dcx = node.position[0] + node.size[0] - csize + dpad;
                const dcy = node.position[1] + dpad;
                ctxt.beginPath();
                ctxt.moveTo(dcx, dcy);
                ctxt.lineTo(dcx + (csize - (dpad * 2)), dcy + (csize - (dpad * 2)));
                ctxt.moveTo(dcx + (csize - (dpad * 2)), dcy);
                ctxt.lineTo(dcx, dcy + (csize - (dpad * 2)));
                ctxt.stroke();

                ctxt.globalAlpha = 1;
            }
        }

        // draw selection bounds
        ctxt.lineWidth = (1 / this.currentScale);
        const bounds = this.canvas.getNodeBounds(this.selection);

        ctxt.beginPath();
        ctxt.moveTo(bounds.minX - 0.5, bounds.minY);
        ctxt.lineTo(bounds.maxX - 0.5, bounds.minY);
        ctxt.lineTo(bounds.maxX - 0.5, bounds.maxY);
        ctxt.lineTo(bounds.minX - 0.5, bounds.maxY);
        ctxt.closePath();
        ctxt.stroke();
        ctxt.beginPath();
        ctxt.arc(bounds.originX, bounds.originY, 5 / this.currentScale, 0, Math.PI * 180);
        ctxt.stroke();

        ctxt.strokeStyle = this.colors.line_color;
        ctxt.strokeRect(bounds.minX, bounds.minY, bounds.width, bounds.height);

        // update html ui
        for(let node of this.canvas.nodes) {
            const id = node.element;
            const element = this.canvas.getNodeElement(node);

            if(this.uiElements[id]) {
                // is text node by default
                if(this.pointer.focusedElement == node) {
                    this.uiElements[id].removeAttribute('invisible');
                } else {
                    this.uiElements[id].setAttribute('invisible', '');
                }
            }

            // draw ui nodes
            const uiNodeId = 'node_' + id;
            if(!this.uiElements[uiNodeId]) {
                if(element.type in NODE_TYPES) {
                    const NodeUIElement = NODE_TYPES[element.type].NodeUIElement;
                    if(NodeUIElement) {
                        this.uiElements[uiNodeId] = new NodeUIElement(this);
                        this.uiElements[uiNodeId].setAttribute('node-id', id);
                        this.shadowRoot.querySelector('#canvasOverlay').appendChild(this.uiElements[uiNodeId]);
    
                        this.uiElements[uiNodeId].addEventListener('change', e => {
                            node.extras[e.key] = e.value;
                        });
                    }
                }
            } else {
                const ele = this.uiElements[uiNodeId];
                const pos = this.canvasToView(...node.position);
                ele.style.setProperty('--x', pos[0]);
                ele.style.setProperty('--y', pos[1]);
                ele.style.setProperty('--w', node.size[0] * this.currentScale);
                ele.style.setProperty('--h', node.size[1] * this.currentScale);
                ele.style.setProperty('--s', this.currentScale);

                ele.onDraw(node, element);
            }

            if(element.type in NODE_TYPES) {
                const Node = NODE_TYPES[element.type];
                Node.onUiDraw(node, this);
            }

            // draw overlay elements
            if(!this.uiElements[id]) {
                if(element.type in NODE_TYPES) {
                    const OverlayElement = NODE_TYPES[element.type].OverlayElement;
                    if(OverlayElement) {
                        this.uiElements[id] = new OverlayElement();
                        this.uiElements[id].setAttribute('node-id', id);
                        this.shadowRoot.querySelector('#canvasOverlay').appendChild(this.uiElements[id]);
    
                        this.uiElements[id].addEventListener('change', e => {
                            node.extras[e.key] = e.value;
                        });
                    }
                }
            } else {
                const ele = this.uiElements[id];
                const pos = this.canvasToView(...node.position);
                ele.style.setProperty('--x', pos[0]);
                ele.style.setProperty('--y', pos[1]);
                ele.style.setProperty('--w', node.size[0] * this.currentScale);
                ele.style.setProperty('--h', node.size[1] * this.currentScale);
                ele.style.setProperty('--s', this.currentScale);
            }
        }
    }

    getNodeUiElement(node) {
        const id = node.element;
        const uiNodeId = 'node_' + id;
        return this.uiElements[uiNodeId];
    }

    _drawPointer(ctxt) {
        ctxt.strokeStyle = this.colors.selection_border;
        ctxt.fillStyle = this.colors.selection_background;
        ctxt.lineWidth = 1;
        ctxt.beginPath();
        ctxt.moveTo(this.pointer.selection[0][0] - 0.5, this.pointer.selection[0][1]);
        ctxt.lineTo(this.pointer.selection[1][0] - 0.5, this.pointer.selection[0][1]);
        ctxt.lineTo(this.pointer.selection[1][0] - 0.5, this.pointer.selection[1][1]);
        ctxt.lineTo(this.pointer.selection[0][0] - 0.5, this.pointer.selection[1][1]);
        ctxt.closePath();
        ctxt.stroke();
        ctxt.fill();
    }

    _drawResolutionPreview(ctxt) {
        ctxt.globalAlpha = 0.25;
        ctxt.strokeStyle = "white";
        ctxt.fillStyle = "rgb(238 238 238 / 0.5)";
        ctxt.lineWidth = 1 / this.currentScale;
        const w = 1920;
        const h = 1080;
        ctxt.fillRect(-w/2 - 0.5, -h/2 - 0.5, w, h);
        ctxt.strokeRect(-w/2 - 0.5, -h/2 - 0.5, w, h);
        ctxt.globalAlpha = 1;
    }

    draw(ctxt) {
        if(!this.canvas)
            return;

        this.resize();

        ctxt.save();
        ctxt.translate(
            (this.width / 2),
            (this.height / 2),
        );
        ctxt.scale(
            this.currentScale,
            this.currentScale,
        );
        ctxt.translate(
            this.canvas.canvas.view[0],
            this.canvas.canvas.view[1],
        );

        ctxt.lineWidth = (1 / this.currentScale);

        const drawChain = [
            this._drawGrid.bind(this),
            (ctxt) => {
                if(Preferences.get('resolution-preview')) {
                    this._drawResolutionPreview(ctxt)
                }
            },
            () => { renderer.render(ctxt, this.canvas) },
            this._drawUI.bind(this),
        ]

        for(let f of drawChain) {
            f(ctxt);
        }

        ctxt.restore();

        // draw pointer selection
        this._drawPointer(ctxt);

        // drwa full frame image
        if(this.pointer.zoomImage && this.pointer.node) {
            const node = this.pointer.node;
            const element = this.canvas.getNodeElement(node);
            if(element.image) {
                const ar = element.image.width / element.image.height;
                const size = this.height - 300;
    
                if(element.image.width > 0) {
                    ctxt.drawImage(
                        element.image,
                        0,
                        0,
                        element.image.width,
                        element.image.height,
                        20,
                        this.height - (size / ar) - 20,
                        size,
                        size / ar,
                    );
                }
            }

            if(element.type in NODE_TYPES) {
                const Node = NODE_TYPES[element.type];
                Node.onDraw(node, ctxt);
            }
        }
    }

    drawPreview() {
        return renderer.renderSnapshot(this.canvas);
    }

    resize() {
        this.canvasElement.width = this.clientWidth;
        this.canvasElement.height = this.clientHeight;
    }

    update() {
        this.draw(this.context);

        if(!this.pointer.selecting) {
            const node = this.hitTestNode(this.pointer.x, this.pointer.y);
            this.pointer.node = node;

            if(node) {
                this.pointer.lastNode = node;
            }
        }

        this.currentScale += (this.canvas.canvas.scale - this.currentScale) * 0.2;

        requestAnimationFrame(this.update.bind(this));

        this.render();
    }

    pickColor(x, y) {
        const data = this.context.getImageData(x, y, 1, 1);
        return data.data;
    }

    render() {
        render(html`
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');
                ::host {
                    font-family: 'Roboto', sans-serif;
                    image-rendering: pixelated;
                }
                ::selection {
                    background: grey;
                }
                canvas {
                    position: absolute;
                    top: 0;
                    left: 0;
                    image-rendering: pixelated;
                }
                .canvas-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 10;
                }
                input {
                    width: 300px;
                    padding: 8px 12px;
                    backdrop-filter: blur(4px);
                }
                button {
                    cursor: pointer;
                }
                button, input {
                    background: transparent;
                    font-size: 18px;
                    color: #eee;
                    outline: none;
                    background: rgb(70 70 70 / 75%);
                    border-radius: 4px;
                    font-family: 'Roboto', sans-serif;
                    box-shadow: 1px 3px 8px rgb(0 0 0 / 10%);
                    border: 1px solid #505050;
                }
                button:hover {
                    background: rebeccapurple;
                }
                button:active {
                    background: #7337af;
                }
                input:hover {
                    background: #ffffff55;
                }
                input:focus {
                    background: #ffffff44;
                }
                .whiteboard-title {
                    position: absolute;
                    top: 15px;
                    right: 20px;
                    z-index: 100;
                }
                .toolbar {
                    position: absolute;
                    top: 15px;
                    left: 20px;
                    z-index: 100;
                    display: grid;
                    grid-auto-flow: column;
                    grid-gap: 20px;
                }
                .sidebar {
                    position: absolute;
                    top: 90px;
                    left: 20px;
                    z-index: 100;
                    display: grid;
                    grid-auto-flow: row;
                    grid-gap: 20px;
                    align-items: flex-start;
                    justify-content: flex-start;
                    align-content: flex-start;
                    height: calc(100% - 90px);
                }
                .button button {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    backdrop-filter: blur(4px);
                    line-height: 100%;
                    padding-top: 2px;
                }
                svg {
                    width: 24px;
                    height: 24px;
                }
                .home-btn {
                    position: absolute;
                    bottom: 25px;
                }
                .seperator {
                    height: 1px;
                    background: rgb(70 70 70 / 75%);
                    margin: 0 2px;
                }
            </style>
            <div class="toolbar">
                <div class="button">
                    <button title="Open" @click="${() => window.openFile()}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>
                    </button>
                </div>
                <div class="button">
                    <button title="Import" @click="${() => window.importImage()}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h4v-2H5V8h14v10h-4v2h4c1.1 0 2-.9 2-2V6c0-1.1-.89-2-2-2zm-7 6l-4 4h3v6h2v-6h3l-4-4z"/></svg>
                    </button>
                </div>
                <div class="button">
                    <button title="Save" @click="${() => window.saveFile()}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
                    </button>
                </div>
                <div class="button">
                    <button title="Save Snapshot" @click="${() => window.saveSnapshot()}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/></svg>   
                    </button>
                </div>

                <div class="button">
                    <button title="Step Backwards" @click="${() => this.canvas.stepBack()}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>   
                    </button>
                </div>
                <div class="button">
                    <button title="Step Forwards" @click="${() => this.canvas.stepForward()}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
                    </button>
                </div>
            </div>
            <div class="sidebar">
                <div class="button">
                    <button title="Paste" @click="${() => window.pasteImage()}">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/></svg>
                    </button>
                </div>

                <div class="button home-btn">
                    <button title="Home" @click="${() => window.openHome()}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                    </button>
                </div>

                <div class="seperator"></div>

                <tolbar-element @change="${e => {
                    const tool = TOOLS_MAP[e.target.activeTool];
                    const index = TOOLS.indexOf(tool);
                    this.setActiveTool(index);
                }}">
                    <tolbar-tool value="select">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M17 5h-2V3h2v2zm-2 16h2v-2.59L19.59 21 21 19.59 18.41 17H21v-2h-6v6zm4-12h2V7h-2v2zm0 4h2v-2h-2v2zm-8 8h2v-2h-2v2zM7 5h2V3H7v2zM3 17h2v-2H3v2zm2 4v-2H3c0 1.1.9 2 2 2zM19 3v2h2c0-1.1-.9-2-2-2zm-8 2h2V3h-2v2zM3 9h2V7H3v2zm4 12h2v-2H7v2zm-4-8h2v-2H3v2zm0-8h2V3c-1.1 0-2 .9-2 2z"/></svg>
                    </tolbar-tool>
                    <tolbar-tool value="pen">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </tolbar-tool>
                </tolbar-element>
            </div>
            <div class="whiteboard-title">
                <input type="text" placeholder="Title" value="${this.canvas.canvas.title}" @input=${e => {
                    this.canvas.canvas.title = e.target.value;
                }}/>
            </div>
            <div class="canvas-overlay" id="canvasOverlay"></div>
            ${this.canvasElement}
        `, this.shadowRoot);
    }

}

// util functions
const cursorCanvas = document.createElement('canvas');
function makeBrushCursor(r = 10) {
    const size = r * 2 + 2;
    cursorCanvas.width = size;
    cursorCanvas.height = size;
    const ctxt = cursorCanvas.getContext("2d");
    ctxt.arc(size / 2, size / 2, r, 0, Math.PI * 180);
    ctxt.shadowColor = 'black';
    ctxt.shadowBlur = 1.5;
    ctxt.strokeStyle = "#eee";
    ctxt.lineWidth = 1.5;
    ctxt.stroke();
    return `url(${cursorCanvas.toDataURL()}) ${size/2} ${size/2}, auto`;
}

function makeColorPickerCursor(color = [0, 0, 0]) {
    const r = 15;
    const cssColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    const padding = 5;
    cursorCanvas.width = 125;
    cursorCanvas.height = 69;
    const ctxt = cursorCanvas.getContext("2d");
    ctxt.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctxt.shadowBlur = 12;

    ctxt.fillStyle = cssColor;
    ctxt.lineWidth = 1.5;
    ctxt.strokeStyle = '#eee';

    const size = r * 2 + 2;
    ctxt.arc(padding + size / 2, padding + size / 2, r, 0, Math.PI * 180);
    ctxt.fill();
    ctxt.stroke();

    ctxt.shadowBlur = 0;

    ctxt.fillStyle = "#fff";
    ctxt.shadowColor = 'rgba(0, 0, 0, 1)';
    ctxt.shadowBlur = 1;
    ctxt.shadowOffsetX = 1;
    ctxt.shadowOffsetY = 1;

    ctxt.font = "12px Roboto";
    const lineHeight = 14;
    const x = r * 2 + 10 + padding;
    ctxt.fillText('R ' + color[0], x, 10 + padding);
    ctxt.fillText('G ' + color[1], x, 10 + padding + lineHeight);
    ctxt.fillText('B ' + color[2], x, 10 + padding + lineHeight * 2);
    
    const hsl = rgbToHsl(...color);
    ctxt.fillText('H ' + hsl[0], x + 40, 10 + padding);
    ctxt.fillText('S ' + hsl[1], x + 40, 10 + padding + lineHeight);
    ctxt.fillText('L ' + hsl[2], x + 40, 10 + padding + lineHeight * 2);

    ctxt.font = "14px sans-serif";
    ctxt.fillText(rgbToHex(...color).toLocaleUpperCase(), x, padding + 55);

    ctxt.shadowOffsetX = 0;
    ctxt.shadowOffsetY = 0;

    return `url(${cursorCanvas.toDataURL()}) ${size/2 + padding} ${size/2 + padding}, auto`;
}

function pointInRect(p, p2, width, height) {
    return  p[0] > p2[0] && p[0] < p2[0] + width &&
            p[1] > p2[1] && p[1] < p2[1] + height;
}

function pointsInRect(points, verts) {
    let result = true;
    for(let point of points) {
        result = point[0] > verts[0][0] && point[0] < verts[1][0] &&
                 point[1] > verts[0][1] && point[1] < verts[1][1];

        if(result == false) {
            break;
        }
    }
    return result;
}

customElements.define('canvas-element', CanvasElement);
