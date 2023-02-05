import { html, css, LitElement, PropertyValueMap } from "lit";
import { ClipElement } from "./VideoClip";
import { Track, Clip } from "./Track";
import { Asset } from "../Assets";
import "./ToggleButton";
import { dragElement } from "../utils";
import { StateManager } from "../StateManager";
import "@atrium-ui/material-icon";
import style from "./videoeditor.css.ts";

export class VideoEditor extends LitElement {
  togglePlayPause() {
    const state = StateManager.getState();
    StateManager.dispatch({ type: "playstate", playstate: !state.playstate });
  }

  skipToStart() {
    const state = StateManager.getState();
    StateManager.dispatch({ type: "time", time: state.timeoffset });
    StateManager.dispatch({ type: "playstate", playstate: false });
  }

  skipToEnd() {
    const state = StateManager.getState();
    StateManager.dispatch({
      type: "time",
      time: state.timeoffset + state.length,
    });
    StateManager.dispatch({ type: "playstate", playstate: false });
  }

  createTrack() {
    this.loadSequence({
      data: [new Track("track1"), new Track("track2")],
    });
  }

  static get styles() {
    return css`
      ${style}

      :host {
        --head-width: 300px;
        --track-height: 60px;
        --zoom: 1;
      }

      .tracks {
        width: 100%;
        display: flex;
        flex-direction: column;
      }

      .tracks::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: var(--head-width);
        height: 100%;
        background: var(--gyro-level2-bg);
        border-right: 1px solid black;
        z-index: 1000;
      }

      .track {
        width: 100%;
        height: var(--track-height);
        background: var(--gyro-level2-bg);
        display: flex;
      }

      .track-header {
        width: var(--head-width);
        background: var(--gyro-level3-bg);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        border-bottom: 1px solid var(--gyro-level1-bg);
      }

      .track-name {
        font-size: 12px;
        width: 100%;
        padding: 0 10px;
        opacity: 0.5;
        line-height: 100%;
        text-transform: capitalize;
      }

      .track-content {
        flex: 1;
        position: relative;
        border-bottom: 1px solid var(--gyro-level1-bg);
      }

      .track-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 5px;
        background: var(--gyro-level3-bg);
        z-index: 10000;
        --icon-size: 14px;
      }

      .track-controls toggle-button,
      .track-controls button {
        margin: 0 1px;
        background: transparent;
      }

      .playbtn .active-icon {
        display: none;
      }
      .playbtn[checked] *:not(.active-icon) {
        display: none;
      }
      .playbtn[checked] .active-icon {
        display: block;
      }

      .timeline .track {
        height: 35px;
      }

      .timeline .track-content {
        background: var(--gyro-level2-bg);
      }

      .timeline #timeline {
        width: 100%;
        height: 100%;
      }

      .time-head {
        position: absolute;
        z-index: 10000;
        top: 30px;
        left: var(--head-width);
        height: 100%;
        width: 1px;
        background: var(--gyro-accent-color);
        transform: translateX(calc(var(--time, 0) * 100px * var(--zoom)));
      }

      .time-head:before {
        content: "";
        position: absolute;
        bottom: 100%;
        width: 5px;
        height: 30px;
        background: inherit;
        transform: translate(-50%, 0);
        border-radius: 5px;
      }

      .time {
        padding: 0 0 0 10px;
        box-sizing: border-box;
        font-weight: 100;
        width: 100%;
        font-size: 16px;
        font-family: "Open Sans", sans-serif;
      }

      .clip-range {
        background: rgba(255, 255, 255, 0.02);
        position: absolute;
        top: 0;
        left: var(--head-width);
        transform: translateX(
          calc((var(--offset) + var(--scroll)) * 100px * var(--zoom))
        );
        height: 100%;
        width: calc(var(--length) * 100px);
        z-index: 1000;
        pointer-events: none;
      }

      .clip-range-center {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 30px;
        cursor: w-resize;
        opacity: 0.3;
        pointer-events: none;
      }

      .clip-range-center::after {
        content: "...";
        line-height: 100%;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        top: 0;
        padding-top: 2px;
        box-sizing: border-box;
        height: 30px;
        width: 20px;
        display: inline-flex;
        justify-content: center;
        letter-spacing: 1px;
        pointer-events: all;
      }

      .clip-range-end {
        pointer-events: all;
        position: absolute;
        top: 0;
        right: 0;
        height: 30px;
        width: 3px;
        transform: translateX(50%);
        background: var(--gyro-highlight);
        cursor: w-resize;
      }

      .clip-range-start {
        pointer-events: all;
        position: absolute;
        top: 0;
        left: 0;
        height: 30px;
        width: 3px;
        transform: translateX(-50%);
        background: var(--gyro-highlight);
        cursor: w-resize;
      }

      .tracks-scrollbar-handle:hover,
      .clip-range-center:hover,
      .clip-range-end:hover,
      .clip-range-start:hover {
        background: var(--gyro-highlight);
      }

      .tracks-scrollbar-handle:active,
      .clip-range-center:active,
      .clip-range-end:active,
      .clip-range-start:active {
        background: var(--gyro-accent-color);
      }

      .tracks-scrollbar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 9px;
        background: var(--gyro-level1-bg);
        z-index: 100000;
      }

      .tracks-scrollbar-handle {
        height: 100%;
        width: calc(200px / var(--zoom));
        border-radius: 10px;
        background: var(--gyro-level4-bg);
        position: absolute;
        top: 0;
        left: 0;
        transform: translateX(calc(var(--scroll) * var(--pixel-ratio) * -1px));
      }
    `;
  }

  render() {
    const tracks = this.tracks || [];
    const instance = this;

    return html`
      <div class="clip-range">
        <div class="clip-range-start"></div>
        <div class="clip-range-center"></div>
        <div class="clip-range-end"></div>
      </div>
      <div class="time-head"></div>
      <div class="tracks timeline">
        <div class="track">
          <div class="track-header">
            <span id="time" class="time"></span>

            <div class="track-controls">
              <button
                class="tool-button"
                @click=${() => instance.skipToStart()}
                title="To the beginning"
              >
                <material-icon icon="skip_previous"></material-icon>
              </button>
              <toggle-button
                class="tool-button playbtn"
                id="playbtn"
                @change=${() => instance.togglePlayPause()}
                title="Play / Pause"
              >
                <material-icon icon="play_arrow"></material-icon>
                <material-icon icon="pause" class="active-icon"></material-icon>
              </toggle-button>
              <button
                class="tool-button"
                @click=${() => instance.skipToEnd()}
                title="To the end"
              >
                <material-icon icon="skip_next"></material-icon>
              </button>
            </div>

            <div class="track-controls">
              <button
                class="tool-button"
                @click=${() => instance.createTrack()}
                title="Create track"
              >
                <material-icon icon="movie"></material-icon>
              </button>
            </div>
          </div>
          <div class="track-content">
            <canvas id="timeline"></canvas>
          </div>
        </div>
      </div>
      <div class="tracks">
        ${tracks.map((track) => {
          return html`
            <div class="track">
              <div class="track-header">
                <span class="track-name">${track.name}</span>
              </div>
              <div class="track-content">
                <slot name="${track.name}"></slot>
              </div>
            </div>
          `;
        })}
      </div>
      <div class="tracks-scrollbar">
        <div class="tracks-scrollbar-handle"></div>
      </div>
    `;
  }

  get pixelRatio() {
    return 10 * this.zoom;
  }

  get tracks() {
    return this.sequence ? this.sequence.data : [];
  }

  loadSequence(sequenceAsset) {
    this.sequence = sequenceAsset;

    this.innerHTML = "";

    for (let track of this.tracks) {
      for (let clip of track.clips) {
        this.addClip(clip, track);
      }

      if (track.clips.length < 1) {
        this.addClip(new Clip(null, 0, 5), track);
      }
    }

    this.requestUpdate();
  }

  initEditor() {
    this.innerHTML = "";

    for (let [name, asset] of Asset.list()) {
      if (asset.type == "sequence") {
        this.loadSequence(asset);
        break;
      }
    }
  }

  addClip(clip, track) {
    track = track || this.tracks[0];

    const clipEle = new ClipElement();
    clipEle.slot = track.name;
    clipEle.title = clip.asset ? clip.asset.name : "Clip";
    clipEle.clip = clip;

    this.appendChild(clipEle);

    clipEle.setStartAndEndPoint(clip.startTime, clip.endTime);
  }

  async connectedCallback() {
    super.connectedCallback();

    this.requestUpdate();
    await this.updateComplete;

    this.selection = new Set();

    this.zoom = 1;
    this.scroll = 0;

    this.style.setProperty("--pixel-ratio", this.pixelRatio);

    const viewer = document.querySelector("gyro-image-editor");

    StateManager.subscribe((state, initial) => {
      this.setTimeHead();

      this.shadowRoot.querySelector("#time").innerHTML = `
                ${Math.floor(state.time / 60)
                  .toString()
                  .padStart(2, "0")} :
                ${Math.floor(state.time).toString().padStart(2, "0")} :
                ${Math.floor((state.time * 100) % 100)
                  .toString()
                  .padStart(2, "0")}
            `;

      if (initial) {
        this.initEditor(state);
      }

      const time = state.time;

      for (let track of this.tracks) {
        for (let clip of track.clips) {
          if (clip.startTime <= time && clip.endTime >= time) {
            this.currentOutput = clip;
            break;
          } else {
            this.currentOutput = null;
          }
        }
      }

      if (this.currentOutput) {
        const asset = this.currentOutput.asset;

        if (asset.scene) {
          const obs = document.querySelector("gyro-obs");
          if (obs) {
            obs.obs.switchScene({ name: asset.scene });
          }
        }
      }

      const playbtn = this.shadowRoot.querySelector("#playbtn");
      playbtn.checked = state.playstate;
    });

    // init dom interaction

    this.addEventListener("wheel", (e) => {
      if (e.altKey) {
        this.zoom -= Math.sign(e.deltaY) / 10;
        this.zoom = Math.min(Math.max(this.zoom, 0.2), 2.0);

        this.scroll += Math.sign(e.deltaY);
      } else {
        this.scroll += Math.sign(-e.deltaY) / this.zoom;
      }

      this.scroll = Math.min(this.scroll, 0);

      this.setTimeHead();
      this.requestUpdate();
    });

    const timeline = this.shadowRoot.querySelector("#timeline");

    this.bounds = timeline.getBoundingClientRect();

    const boundsUpdate = () => {
      this.renderTimeline();
      this.bounds = timeline.getBoundingClientRect();
    };

    window.addEventListener("layout", boundsUpdate);
    window.addEventListener("resize", boundsUpdate);

    // time head
    const head = this.shadowRoot.querySelector(".time-head");

    const moveHead = (e) => {
      const offset = this.bounds.x / this.zoom / 10;
      const x = e.x / this.zoom / 10;
      const newTime = Math.max((x - offset) / 10 - this.scroll, 0);

      if (e.mousedown) {
        StateManager.dispatch({ type: "time", time: newTime });
        StateManager.dispatch({ type: "playstate", playstate: false });
      } else {
        StateManager.dispatch({ type: "time", time: newTime });
      }
    };

    dragElement(timeline, moveHead);
    dragElement(head, moveHead);

    // move clip range
    const startElement = this.shadowRoot.querySelector(".clip-range-start");
    const endElement = this.shadowRoot.querySelector(".clip-range-end");
    const centerElement = this.shadowRoot.querySelector(".clip-range-center");

    let lastOffset = 0;
    let lastLength = 0;

    dragElement(centerElement, (change) => {
      if (change.mousedown) {
        const state = StateManager.getState();
        lastOffset = state.timeoffset;
      } else {
        const timeChange = change.absolute[0] / this.pixelRatio / 10;
        const timeoffset = Math.max(lastOffset - timeChange, 0);

        StateManager.dispatch({ type: "timeoffset", timeoffset: timeoffset });
      }
    });

    dragElement(endElement, (change) => {
      if (change.mousedown) {
        const state = StateManager.getState();
        lastLength = state.length;
      } else {
        const timeChange = change.absolute[0] / this.pixelRatio / 10;
        const length = Math.max(lastLength - timeChange, 0.1);
        StateManager.dispatch({ type: "length", length: length });
      }
    });

    dragElement(startElement, (change) => {
      if (change.mousedown) {
        const state = StateManager.getState();
        lastOffset = state.timeoffset;
        lastLength = state.length;
      } else {
        const timeChange = change.absolute[0] / this.pixelRatio / 10;

        const timeoffset = Math.max(lastOffset - timeChange, 0);
        const length = lastLength - (timeoffset - lastOffset);

        if (length > 0.1) {
          StateManager.dispatch({ type: "length", length: length });
          StateManager.dispatch({ type: "timeoffset", timeoffset: timeoffset });
        }
      }
    });

    const scrollbar = this.shadowRoot.querySelector(".tracks-scrollbar-handle");

    let lastScroll = 0;

    dragElement(scrollbar, (change) => {
      if (change.mousedown) {
        lastScroll = this.scroll;
      } else {
        this.scroll =
          lastScroll + (change.absolute[0] / this.pixelRatio) * this.zoom;
        this.scroll = Math.min(this.scroll, 0);

        this.setTimeHead();
        this.requestUpdate();
      }
    });

    this.addEventListener("click", (e) => {
      for (let child of this.children) {
        if (child != e.target) {
          child.dispatchEvent(new Event("deselect"));
        }
      }
    });

    this.addEventListener("clipchange", (e) => {
      const state = StateManager.getState();
      StateManager.dispatch({ type: "time", time: state.time });

      const sorted = [...this.children].sort((a, b) =>
        a.startTime < b.startTime ? -1 : +1
      );
      for (let child of this.children) {
        child.remove();
      }
      for (let child of sorted) {
        this.appendChild(child);
      }
    });
  }

  setTimeHead() {
    const state = StateManager.getState();
    this.style.setProperty("--length", state.length * this.zoom);
    this.style.setProperty("--offset", state.timeoffset);
    this.style.setProperty("--zoom", this.zoom);
    this.style.setProperty("--time", state.time + this.scroll);
    this.style.setProperty("--scroll", this.scroll);
  }

  protected updated(): void {
    this.renderTimeline();
  }

  renderTimeline() {
    const timeline = this.shadowRoot.querySelector("#timeline");
    const context = timeline.getContext("2d");

    timeline.width = timeline.clientWidth;
    timeline.height = timeline.clientHeight;

    const y = timeline.height;
    const pixelRatio = this.pixelRatio;

    context.font = "100 10px Roboto";
    context.textAlign = "center";
    context.fillStyle = "rgba(255,255,255,0.25)";

    const offset = this.scroll * this.pixelRatio * 10;

    for (let time = 0; time < timeline.width; time++) {
      context.save();
      context.translate(offset, 0);

      if (time % 10 == 0) {
        context.fillRect(time * pixelRatio, y, 1, -8);
        context.fillText(Math.floor(time / 10), time * pixelRatio, y - 15);
      } else if (time % 1 == 0) {
        context.fillRect(time * pixelRatio, y, 1, -4);
      }

      context.restore();
    }
  }
}

customElements.define("gyro-video-clip", ClipElement);
customElements.define("gyro-video-editor", VideoEditor);
