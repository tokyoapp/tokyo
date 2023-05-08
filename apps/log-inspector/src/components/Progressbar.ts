import { html, css, LitElement } from 'lit-element';

export class ProgressBar extends LitElement {

    constructor(progress = 0) {
        super();

        this.progress = 0;
        this.logs = [];

        if(progress) {
            this.setProgress(progress);
        }

        this.debugLog = document.createElement('debug-log');
    }

    log(...stringArray) {
        this.debugLog.appendLine(stringArray.join(" "));
    }

    setProgress(prog) {
        this.progress = prog;
    }

    render() {
        if(!this.logs) {
            return html``;
        }
        const prog = this.progress / 100;

        return html`
            <style>
                :host {
                    position: absolute;
                    bottom: 15px;
                    left: 15px;
                    background: rgba(128, 128, 128, 0.5);
                    width: 400px;
                    height: 10px;

                    --progress: ${prog};
                }
                .progressbar {
                    height: 100%;
                    background: white;
                    transition: width .15s ease;
                    width: calc(var(--progress) * 100%);
                    overflow: hidden;
                    border-radius: 2px;
                }
                .log {
                    position: absolute;
                    bottom: 10px;
                    left: 0;
                    width: 100%;
                    margin-bottom: 10px;
                    display: flex;
                    flex-direction: column;
                    max-height: 100px;
                    font-size: 12px;
                    font-family: 'Open-Sans', sans-serif;
                    font-weight: 300;
                }
                debug-log {
                    position: relative;
                    top: 0;
                    left: 0;
                }
            </style>
            <div class="log">
                ${this.debugLog}
            </div>
            <div class="progressbar" data-progress="${prog}"></div>
        `;
    }
}

customElements.define('progress-bar', ProgressBar);
