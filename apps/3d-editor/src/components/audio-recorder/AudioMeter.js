import { html, LitElement } from 'https://cdn.skypack.dev/lit-element@2.4.0';

function splitAudioSourceChannels(audioContext, source) {
    const splitter = audioContext.createChannelSplitter(source.channelCount);
    source.connect(splitter);

    const outputs = [];
    for(let i = 0; i < splitter.channelCount; i++) {
        const gain = audioContext.createGain();
        gain.out = true;
        splitter.connect(gain, i);
        outputs[i] = gain;
    }

    return outputs;
}

export default class AudioStreamMeter extends LitElement {

    constructor(context, name) {
        super();

        this.name = name;
        this.audioContext = context;

        this.meter = new AudioWorkletNode(this.audioContext, 'audio-db-meter');
        this.levels = [0 , 0];

        this.value = [];
        this.history = [];
        this.peak = [];
        this.target = [];
        this.history = [];

        this.meter.port.onmessage = msg => {
            this.levels = msg.data;
        }

        this.canvas = document.createElement('canvas');
        this.canvas.width = 150;
        this.canvas.height = 20;
        this.context = this.canvas.getContext("2d");

        const updateAudioMeter = () => {
            this.renderAudioMeter();
            requestAnimationFrame(updateAudioMeter);
        }
        updateAudioMeter();
    }

    setSourceStream(stream) {
        const audioSource = this.audioContext.createMediaStreamSource(stream);
        this.setAudioSourceNode(audioSource);
    }

    setAudioSourceNode(audioSourceNode) {
        this.audioSource = audioSourceNode;
        this.audioSource.connect(this.meter);
    }

    setAudioSourceFromTrack(audioTrack) {
        const stream = new MediaStream();
        stream.addTrack(audioTrack);
        this.setSourceStream(stream);
    }

    renderAudioMeter() {
        const channelHeight = 2;
        this.canvas.height = channelHeight * this.levels.length + (this.levels.length - 1);

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
            const y = channel * channelHeight + (channel);

            this.context.fillStyle = "#1a8e1a";
            this.context.fillRect(0, y, this.target[channel], channelHeight);

            this.context.fillStyle = "#00ff00";
            this.context.fillRect(0, y, this.value[channel], channelHeight);

            if(this.levels[channel] < 0) {
                this.context.fillStyle = "#00ff00";
            } else {
                this.context.fillStyle = "red";
            }
            this.context.fillRect(this.peak[channel], y, 1, channelHeight);
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
                }
            </style>
            ${this.name ? html`
                <div class="name">${this.name}</div>
            ` : ""}
            ${this.canvas}
        `;
    }

}

customElements.define('audio-meter', AudioStreamMeter);
