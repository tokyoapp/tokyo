import { html, render } from 'https://unpkg.com/lit-html@1.3.0/lit-html.js';
import DropdownButton from '../gyro/DropdownButton.js';
import FluidInput from '../gyro/FluidInput.js';
import GyroInput from '../gyro/Input.js';

class DataChangeEvent extends Event {
    constructor(key, value) {
        super('change');
        this.key = key;
        this.value = value;
    }
}

export class CanvasOverlayElement extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.data = {
            'font-family': 'Roboto',
            'font-size': "69px",
            'color': "grey",
        }

        
        this.fontDropDown = new DropdownButton({
            options: [ 
                { name: "Roboto", value: "Roboto" }, 
                { name: "Open Sans", value: "Open Sans" }, 
                { name: "Monospace", value: "Monospace" }, 
            ]
        });
        this.fontDropDown.addEventListener('change', e => {
            this.setData('font-family', this.fontDropDown.value.value);
        });
        this.sizeInput = new FluidInput();
        this.sizeInput.addEventListener('change', e => {
            this.setData('font-size', this.sizeInput.value + "px");
        });
    }

    connectedCallback() {
        this.update();
    }

    update() {
        render(this.render(), this.shadowRoot);
    }

    emitDataChange(key) {
        this.dispatchEvent(new DataChangeEvent(key, this.data[key]));
    }

    setData(key, value) {
        this.data[key] = value;
        this.emitDataChange(key);
    }

    render() {
        return html`
            <style>
                :host {
                    position: absolute;
                    top: calc(var(--y) * 1px + var(--h) * 1px);
                    left: calc(var(--x) * 1px);
                    margin-top: 10px;
                    pointer-events: all;
                    padding: 8px;
                    border-radius: 4px;
                    background: rgb(33 33 33 / 0.75);
                    box-shadow: 1px 3px 8px rgb(0 0 0 / 25%);
                    border: 1px solid #252525;
                    backdrop-filter: blur(4px);
                    user-select: none;
                    z-index: 100000;
                    transform-origin: 10px -40px;
                }
                .container-corner {
                    position: absolute;
                    bottom: 100%;
                    left: 10px;
                    display: block;
                    fill: #252525;
                }
                .container {
                    display: flex;
                }
                .container > *:not(:last-child) {
                    margin-right: 10px;
                }
                svg {
                    display: block;
                }
                :host {
                    opacity: 1;
                    animation: show .075s ease-out;
                    transition: opacity .075s ease-out, 
                                transform .1s ease-out, 
                                clip-path .1s ease-out;
                }
                @keyframes show {
                    from {
                        clip-path: polygon(0 0, 0 0, 0 100%, 0% 100%);
                    }
                    to {
                        clip-path: polygon(0 -20px, 100% 0, 100% 100%, 0% 100%);
                    }
                }
                @keyframes hide {
                    from {
                        clip-path: polygon(0 -20px, 100% 0, 100% 100%, 0% 100%);
                    }
                    to {
                        clip-path: polygon(0 0, 0 0, 0 100%, 0% 100%);
                    }
                }
                :host([invisible]) {
                    animation: hide .075s ease-out;
                    opacity: 0;
                    transform: scale(0.95);
                    pointer-events: none;
                }
            </style>
            <div class="container-corner">
                <svg width="15.3px" height="8.1px" viewBox="0 0 15.3 8.1" xml:space="preserve">
                    <path class="st0" d="M15.3,7.5L8.6,0.4c-0.5-0.6-1.4-0.6-1.9,0L0,7.5H15.3z"/>
                </svg>
            </div>
            <div class="container">
                ${this.fontDropDown}
                ${this.sizeInput}
            </div>
        `;
    }

}

customElements.define('canvas-overlay-element', CanvasOverlayElement);
