import { html, render } from 'https://unpkg.com/lit-html@1.3.0/lit-html.js';

export class NodeElement extends HTMLElement {

    constructor(canvas) {
        super();
        this.attachShadow({ mode: 'open' });

        this.canvas = canvas;

        this.text = "None";
        this.size = "16px";
    }

    connectedCallback() {
        this.update();
    }

    update() {
        render(this.render(), this.shadowRoot);
    }

    onDraw(node, element) {
        this.text = element.data;
        this.size = node.extras['font-size'];
        this.font = node.extras['font-family'];
        this.update();
    }

    render() {
        return html`
            <style>
                :host {
                    transform-origin: 0 0;
                    transform: scale(${this.canvas.currentScale});
                    position: absolute;
                    top: calc(var(--y) * 1px);
                    left: calc(var(--x) * 1px);
                    width: calc(var(--w) * 1px / var(--s));
                    height: calc(var(--h) * 1px / var(--s));
                    pointer-events: none;
                    background: rgb(33 33 33 / 0.75);
                    box-shadow: 1px 3px 8px rgb(0 0 0 / 25%);
                    border: 1px solid #252525;
                    user-select: none;
                    color: #eee;
                    font-size: ${this.size};
                    font-family: ${this.font};
                    overflow: hidden;
                    word-break: break-all;
                }
            </style>
            <div class="container">
                ${this.text}
            </div>
        `;
    }

}
