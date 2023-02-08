import { html, render } from 'https://unpkg.com/lit-html@1.3.0/lit-html.js';
import Preferences from '../app/Preferences.js';
import './gyro/Switch.js';

export class SettingsElement extends HTMLElement {

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

    themeChange(themId) {
        Preferences.set('theme', themId);
    }

    render() {
        return html`
            <link rel="stylesheet" href="./src/components/component.css"/>
            <style>
                :host {
                    display: block;
                }
                label {
                    margin-bottom: 10px;
                    display: block;
                }
                .row {
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    margin-bottom: 20px;
                }
                label {
                    margin: 0 10px 0 0;
                }
            </style>
            <div class="settings">
                <div class="row">
                    <label>Theme</label>
                    <select .value="${Preferences.get('theme')}" 
                            @change="${e => this.themeChange(e.target.value)}">
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                    </select>
                </div>
                <div class="row">
                    <label>Show resolution preview</label>
                    <input-switch ?checked="${Preferences.get('resolution-preview')}" @change="${e => {
                        Preferences.set('resolution-preview', e.target.checked);
                    }}"></input-switch>
                </div>
            </div>
        `;
    }

}

customElements.define('settings-element', SettingsElement);
