import { CanvasOverlayElement } from "../CanvasOverlayElement.js";
import { NodeElement } from "../NodeElement.js";
import Node from "./Node.js";

class TextNodeElement extends NodeElement {

}

customElements.define('text-node-element', TextNodeElement);

export default class TextNode extends Node {

    static get OverlayElement() {
        return CanvasOverlayElement;
    }

    // static get NodeUIElement() {
    //     return TextNodeElement;
    // }

    static onFocus(canvas, node) {
        
    }

    static onBlur(camvas, node) {
        
    }

}
