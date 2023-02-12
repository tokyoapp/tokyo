import { html, render } from 'https://unpkg.com/lit-html@1.3.0/lit-html.js';

export default class Switch extends HTMLElement {

    static get observedAttributes() { 
        return ['checked'];
    }

    get checked() {
        return this.hasAttribute('checked') && this.getAttribute('checked') != "false";
    }

    set checked(value) {
        if(value === false) {
            this.removeAttribute('checked');
        } else if(value === true) {
            this.setAttribute('checked', '');
        }
    }

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });
    }

    attributeChangedCallback() {
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const clickHandler = () => {
            this.checked = !this.checked;
            this.dispatchEvent(new Event('change'));
        }
        
        const template = html`
            <style>
                :host {
                    --button-size: 18px;
                    
                    border-radius: 100px;
                    overflow: hidden;
                    background: black;
                    cursor: pointer;
                    width: calc(var(--button-size) * 2);
                    display: inline-block;
                }
                :host([checked]) .switch-handle {
                    transform: translateX(100%);
                }
                .switch {
                    z-index: 1;
                    position: relative;
                }
                .switch:active .switch-handle-thumb {
                    filter: brightness(0.85);
                }
                .switch-handle {
                    height: var(--button-size);
                    width: var(--button-size);
                    position: relative;
                    transition: transform .15s cubic-bezier(0.38, 0, 0.08, 1.01);
                }
                .switch-handle::after,
                .switch-handle::before {
                    content: "";
                    top: 0;
                    height: 100%;
                    position: absolute;
                    width: calc(var(--button-size) * 2);
                }
                .switch-handle::after {
                    left: 50%;
                    background: grey;
                }
                .switch-handle::before {
                    right: 50%;    
                    background: var(--accent-color);
                }
                .switch-handle-thumb {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    position: relative;
                    z-index: 1000;
                    background: #eee;
                }
            </style>
            <div class="switch" @click=${clickHandler}>
                <div class="switch-handle">
                    <div class="switch-handle-thumb"></div>
                </div>
            </div>
        `;
        render(template, this.shadowRoot);
    }
}

customElements.define('input-switch', Switch);
