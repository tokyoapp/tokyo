import { css, html, LitElement } from 'lit-element';

export default class DebugElement extends LitElement {

    static get styles() {
        return css`
            :host {
                pointer-events: none;
                opacity: 0.2;
                user-select: none;
                width: 100%;
                max-width: calc(100vw - 40px);
                z-index: 100000;
                font-family: monospace;
                font-size: 14px;
                position: absolute;
                bottom: 20px;
                left: 20px;
            }
        `;
    }

    buffer: Array<string>;

    constructor() {
        super();
        this.buffer = [];
    }

    appendLine(str: string) {
        this.buffer.push(str);
        if(this.buffer.length > 40) {
            this.buffer.shift();
        }
    }

    render() {
        return html`
            ${this.buffer.map(line => {
                return html`<div>${line}</div>`;
            })}
        `;
    }
}

customElements.define('debug-log', DebugElement);