import { html, LitElement } from 'https://cdn.skypack.dev/lit-element@2.4.0';
import AudioStreamMeter from "./AudioMeter.js";

export default class AudioStreamMeterVertecal extends AudioStreamMeter {

    renderAudioMeter() {
        const channelHeight = 2;
        this.canvas.height = 100;
        this.canvas.width = channelHeight * this.levels.length + (this.levels.length - 1);

        for(let channel = 0; channel < this.levels.length; channel++) {
            // eval levels
            this.value[channel] = this.value[channel] || 0;
            this.history[channel] = this.history[channel] || [];
            this.peak[channel] = this.peak[channel] || 0;
            this.target[channel] = this.target[channel] || 0;

            this.target[channel] = 1 / -this.levels[channel] * 1000;

            if(Number.isFinite(this.target[channel])) {
                this.value[channel] += (this.target[channel] - this.value[channel]) * 0.1;
            }

            this.history[channel].push(this.target[channel]);
            if(this.history[channel].length > 100) {
                this.history[channel].shift();
            }

            this.peak[channel] = Math.max(...this.history[channel]);

            // draw everything
            const x = channel * channelHeight + (channel);

            this.context.fillStyle = "#1a8e1a";
            this.context.fillRect(x, this.canvas.height, channelHeight, -this.target[channel]);

            this.context.fillStyle = "#00ff00";
            this.context.fillRect(x, this.canvas.height, channelHeight, -this.value[channel]);

            if(this.levels[channel] < 0) {
                this.context.fillStyle = "#00ff00";
            } else {
                this.context.fillStyle = "red";
            }
            this.context.fillRect(x, this.canvas.height - this.peak[channel], channelHeight, 1);
        }

        this.update();
    }

    render() {
        return html`
            <style>
                :host {
                    display: block;
                }
                .name {
                    margin-bottom: 10px;
                }
                canvas {
                    image-rendering: pixelated;
                    display: block;
                    margin-bottom: 1px;
                    background: rgba(0, 0, 0, 0.25);
                    height: 100%;
                    width: 100%;
                }
            </style>
            ${this.name ? html`
                <div class="name">${this.name}</div>
            ` : ""}
            ${this.canvas}
        `;
    }

}

customElements.define('audio-meter-vertical', AudioStreamMeterVertecal);
