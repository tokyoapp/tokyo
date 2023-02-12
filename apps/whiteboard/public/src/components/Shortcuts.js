import { html, render } from 'https://unpkg.com/lit-html@1.3.0/lit-html.js';
import { Action } from '../input/Actions.js';

window.Action = Action;

export class ShortcutsElement extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.fileList = [];
    }

    connectedCallback() {
        this.update();
    }

    update() {
        render(this.render(), this.shadowRoot);
    }

    render() {

        return html`
            <style>
                :host {
                    display: block;
                }
                .shortcut {
                    display: flex;
                    margin-bottom: 2px;
                    font-weight: 300;
                    font-size: 14px;
                    background: #333;
                    padding: 8px 8px;
                    border-radius: 4px;
                }
                .keys {
                    width: 120px;
                }
                .description {
                    
                }
            </style>
            <div class="settings">
                ${[...Action.actions].map(([id, action]) => {
                    const shortcut = Action.getMap()[action.name];
                    return html`
                        <div class="shortcut">
                            <div class="keys">${shortcut}</div>
                            <div class="description">${action.description}</div>
                        </div>
                    `;
                })}
            </div>
        `;
    }

}

customElements.define('shortcuts-element', ShortcutsElement);
