import Knob from "./Knob.js";
import {
  html,
  css,
  LitElement,
} from "https://cdn.skypack.dev/lit-element@2.4.0";
import AudioUtils from "../audio/AudioUtils.js";
import AudioStreamMeterVertecal from "./AudioMeterVertical.js";
import DropdownButton from "./DropdownButton.js";
import Preferences from "../app/Preferences.js";

function createControlKnob(source) {
  const knob = new Knob();

  knob.min = 0;
  knob.max = 10;
  knob.steps = 0.1;

  knob.setValue(source.getGain());

  knob.addEventListener("change", (e) => {
    source.setGain(knob.value);
  });

  return knob;
}

export default class AudioTrackElement extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        width: 100%;
      }
      .track-container {
        display: grid;
        grid-template-columns: auto;
        height: 151px;
        border-bottom: 1px solid rgb(49 49 49);
      }
      .head {
        background: #272727;
        display: grid;
        grid-template-columns: 150px auto;
      }
      .track-controls {
        padding: 8px;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
      }
      .meter {
        background: darkgrey;
        width: auto;
      }
      audio-meter-vertical {
        height: 100%;
        background: #1c1c1c;
      }
      .label {
        box-sizing: border-box;
        width: 100%;
        padding: 5px 8px;
        background: rgb(51, 51, 51);
        font-size: 11px;
        border-bottom: 1px solid rgb(61, 61, 61);
        display: flex;
        align-items: center;
      }
      .track-body {
        display: grid;
        grid-template-rows: 25px 1fr;
      }
    `;
  }

  constructor(audioContext, track) {
    super();

    this.track = track;
    this.meter = new AudioStreamMeterVertecal(audioContext);
    this.meter.setAudioSourceNode(this.track.getInputNode());

    this.inputDeviceId = null;

    this.initDeviceSelect();
  }

  async initDeviceSelect() {
    const devices = await AudioUtils.getAudioDevies();
    const audioInputDevices = devices.audioinput;

    if (this.inputDeviceId) {
      this.track.setInputDevice(this.inputDeviceId);
    } else {
      const device = audioInputDevices[0];
      this.inputDeviceId = device.deviceId;
      this.track.setInputDevice(device.deviceId);
    }

    const deviceDropdown = new DropdownButton();
    deviceDropdown.options = audioInputDevices.map((dev) => {
      return {
        name: dev.label,
        deviceId: dev.deviceId,
      };
    });
    deviceDropdown.addEventListener("change", (e) => {
      this.track.setInputDevice(deviceDropdown.value.deviceId);
    });

    const currDevice = audioInputDevices.find(
      (dev) => dev.deviceId == this.inputDeviceId
    );
    deviceDropdown.value = {
      name: currDevice.label,
      deviceId: currDevice.deviceId,
    };

    // knob

    this.deopdown = deviceDropdown;
    this.knob = createControlKnob(this.track.audioSource);
    this.update();
  }

  // <div class="rec-toggle">
  //     <toggle-button>X</toggle-button>
  // </div>

  render() {
    return html`
      <div class="track-container">
        <div class="head">
          <div class="track-body">
            <div class="label">${this.track.name}</div>
            <div class="track-controls">
              ${this.deopdown}
              <div class="input-gain">${this.knob}</div>
              <input
                type="checkbox"
                ?checked="${this.track.armed}"
                @change="${(ev) => {
                  this.track.armed = ev.target.checked;
                }}"
              />
            </div>
          </div>
          <div class="meter">${this.meter}</div>
        </div>
      </div>
    `;
  }
}

customElements.define("audio-track", AudioTrackElement);
