import { html, render } from 'https://unpkg.com/lit-html@1.3.0/lit-html.js';
import Preferences from '../app/Preferences.js';
import { RecentFiles } from './RecentFiles.js';
import { SettingsElement } from './Settings.js';
import { ShortcutsElement } from './Shortcuts.js';

// default preferences
Preferences.default('hide-home', false);

export default class HomeElement extends HTMLElement {

    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        this.activeTab = 0;
        this.tabs = [
            new RecentFiles(),
            new SettingsElement(),
            new ShortcutsElement()
        ]
    }

    connectedCallback() {
        this.update();
    }

    update() {
        render(this.render(), this.shadowRoot);
    }

    close() {
        this.classList.add('closeing');
        this.shadowRoot.querySelector('.container').onanimationend = () => {
            this.remove();
        }
    }

    openWhiteboard() {
        window.openFile().then(() => {
            this.close();
        })
    }

    newWhtieboard() {
        window.newCanvas();
        this.close();
    }

    setTab(tab) {
        this.activeTab = tab;
        this.update();
    }

    render() {
        return html`
            <link rel="stylesheet" href="./src/components/Home.css"/>
            <div class="container">
                <div class="header">
                    <span class="title">Home</span>
                    <span class="close-btn" @click="${() => this.close()}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </span>
                </div>
                <div class="navigation">
                    <div class="nav-item" ?active="${this.activeTab == 0}" @click="${() => this.setTab(0)}">Recent</div>
                    <div class="nav-item" ?active="${this.activeTab == 1}" @click="${() => this.setTab(1)}">Settings</div>
                    <div class="nav-item" ?active="${this.activeTab == 2}" @click="${() => this.setTab(2)}">Shortcuts</div>
                </div>
                <div class="wrapper tab-content">
                    ${this.tabs[this.activeTab]}
                </div>
                <div class="wrapper">
                    <div class="buttons">
                        <div>
                            <button class="holo" @click="${() => this.openWhiteboard()}">Open File</button>
                            <button class="accent" @click="${() => this.newWhtieboard()}">New Whiteboard</button>
                        </div>
                        <div class="hide-prompt">
                            <label for="hideHome">Hide home on startup</label>
                            <input ?checked="${Preferences.get('hide-home')}" 
                                    @change="${e => {
                                        Preferences.set('hide-home', e.target.checked);
                                    }}"
                                    id="hideHome" type="checkbox"/>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

}

customElements.define('home-element', HomeElement);