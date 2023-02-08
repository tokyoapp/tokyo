import { html, css, LitElement } from 'https://cdn.skypack.dev/lit-element@2.4.0';
import Timer from '../Timer.js';
import Icons from './Icons.js';

export default class PlaybackControls extends LitElement {

    static get styles() {
        return css`
            :host {
                display: block;
            }
            toggle-button svg, button svg {
                width: 20px;
                height: 20px;
            }
            toggle-button, button {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 4px 8px;
                box-sizing: border-box;
                border: none;
                outline: none;
                border-radius: 4px;
                color: #eee;
                font-weight: bold;
                cursor: pointer;
                background: transparent;
                width: auto;
                height: 32px;
            }
            toggle-button:hover, button:hover {
                background: #1c1c1c;
            }
            toggle-button:active, button:active {
                background: #0c0c0c;
            }
            .buttons {
                display: flex;
            }
        `;
    }

    constructor() {
        super();
        this.playstate = 0;
        this.recordstate = 0;

        Timer.on('play', e => {
            this.playstate = 1;
            this.update();
        })
        Timer.on('pause', e => {
            this.playstate = 0;
            this.update();
        })
    }

    // Events:
    //  play
    //  pause
    //  skiptostart
    //  skiptoend
    //  startrecord
    //  stoprecord

    render() {

        const playPause = e => {
            if(this.playstate === 1) {
                this.dispatchEvent(new Event('pause'));
                this.playstate = 0;
            } else {
                this.dispatchEvent(new Event('play'));
                this.playstate = 1;
            }
            this.update();
        }
        const toStart = e => {
            this.dispatchEvent(new Event('skiptostart'));
        }
        const recordStartStop = e => {
            if(this.recordstate === 1) {
                this.dispatchEvent(new Event('stoprecord'));
                this.recordstate = 0;
            } else {
                this.dispatchEvent(new Event('startrecord'));
                this.recordstate = 1;
            }
            this.update();
        }
        const toEnd = e => {
            this.dispatchEvent(new Event('skiptoend'));
        }
        return html`
            <div class="buttons">
                <button @click="${toStart}">
                    ${Icons.skiptostart}
                </button>
                <toggle-button @click="${recordStartStop}">
                    ${Icons.record}
                </toggle-button>
                <toggle-button @click="${playPause}">
                    ${this.playstate == 1 ? Icons.pause : Icons.play}
                </toggle-button>
                <button @click="${toEnd}">
                    ${Icons.skiptoend}
                </button>
            </div>
        `;
    }

}

customElements.define('playback-controls', PlaybackControls);
