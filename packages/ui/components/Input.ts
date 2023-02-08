import { html, css, LitElement } from 'lit-element';

export default class GyroInput extends LitElement {

    static get styles() {
        return css`
            :host {
                display: inline-block;
                width: 140px;
                height: 28px;
                border-radius: 3px;
                overflow: hidden;
                box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.15);
            }
            :host(:hover) input {
                background: #2E2E2E;
            }
            input {
                width: 100%;
                height: 100%;
                border: none;
                margin: 0;
                outline: none;
                padding: 0;
                background: var(--gyro-pallate-btn-bg);
                color: #fff;
                padding: 0 10px;
                box-sizing: border-box;
            }
            input:focus {
                background: var(--gyro-pallate-panel-bg);
            }
        `;
    }

    onInputChange() {
        this.dispatchEvent(new Event('change'));
    }

    onInputInput() {
        this.dispatchEvent(new Event('input'));
    }

    get value() {
        return this.input.value;
    }

    input: HTMLInputElement;

    constructor() {
        super();

        this.input = document.createElement('input');
        this.input.onchange = e => this.onInputChange(e);
        this.input.oninput = e => this.onInputInput(e);
    }

    render() {
        return html`
            ${this.input}
		`;
    }

    static get properties() {
        return {
            value: {},
            placeholder: {},
        };
    }

    get value() { return this.input.value; }
    set value(val) { this.input.value = val; }

    get placeholder() { return this.input.placeholder; }
    set placeholder(val) { this.input.placeholder = val; }

}

customElements.define('gyro-input', GyroInput);
