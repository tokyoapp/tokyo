import { html, LitElement, css } from 'https://cdn.skypack.dev/lit-element@2.4.0';
import AudioStreamMeterVertecal from './AudioMeterVertical.js';

export default class AudioTrackChannel extends LitElement {

    static get styles() {
        return css`
            :host {
                background: rgb(39, 39, 39);
                min-width: 100px;
                display: grid;
                grid-template-rows: auto 1fr;
            }
            .label {
                font-size: 14px;
                width: 100%;
                text-align: left;
                padding: 6px 6px;
                box-sizing: border-box;
                background: #333333;
            }
            .container {
                padding: 4px;
                display: grid;
                grid-template-rows: auto auto 1fr auto;
            }
            .return-send {
                padding: 4px;
            }
            .level-meter {
                display: grid;
                grid-template-columns: 1fr auto;
            }
            .pan {
                display: flex;
                justify-content: center;
            }
            .pan gyro-knob {
                transform: scale(0.9);
            }
            audio-meter-vertical {
                width: 10px;
            }
        `;
    }

    constructor(audioTrack) {
        super();

        this.track = audioTrack;
        this.meter = new AudioStreamMeterVertecal(this.track.context);
        this.meter.setAudioSourceNode(this.track.getInputNode());
    }

    render() {
        return html`
            <div class="label">
                <span>${this.track.name}</span>
            </div>
            <div class="container">
                <dropdown-button></dropdown-button>
                <div class="return-send">
                    <gyro-knob></gyro-knob>
                </div>
                <div class="level-meter">
                    <vertical-slider></vertical-slider>
                    ${this.meter}
                </div>
                <div class="pan">
                    <gyro-knob min="-1" max="1" value="0" steps="0.1"></gyro-knob>
                </div>
            </div>
        `;
    }

}

customElements.define('audio-channel', AudioTrackChannel);
