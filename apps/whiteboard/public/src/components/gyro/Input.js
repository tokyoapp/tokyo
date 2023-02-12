import { html, render } from 'https://unpkg.com/lit-html@1.3.0/lit-html.js';

export default class GyroInput extends HTMLElement {

    onInputChange() {
        this.dispatchEvent(new Event('change'));
    }

    onInputInput() {
        this.dispatchEvent(new Event('input'));
    }

    template() {
		return html`
			<style>
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
                :host input:focus {
                    background: var(--gyro-pallate-panel-bg);
                }
			</style>
            <input  @change="${e => this.onInputChange(e)}"
                    @input="${e => this.onInputInput(e)}"/>
		`;
	}

	static get observedAttributes() {
		return ['value', 'placeholder'];
	}

	get value() { return this.input.value; }
	set value(val) { this.input.value = val; }

	get placeholder() { return this.input.placeholder; }
	set placeholder(val) { this.input.placeholder = val; }

    get input() {
        return this.shadowRoot.querySelector('input');
    }
    
    constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this[name] = newValue;
    }
    
    render() {
		render(this.template(), this.shadowRoot);
	}

}

customElements.define('gyro-input', GyroInput);
