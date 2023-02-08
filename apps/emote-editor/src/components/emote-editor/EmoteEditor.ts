import "ui/components/DropdownButton";
import "ui/components/FluidInput";
import "ui/components/Slider";
import "ui/components/THColorPicker";
import style from "./EmoteEditor.style";
import { preprocess } from "./ImageProcessing";
import { loadStateFromLocal, pushStateHistory, redo, setState, stateObject, undo } from "./State";
import { html, css, LitElement } from "lit-element";
import Gyro from "atrium/lib/Gyro";

class ColorField extends LitElement {
  static get styles() {
    return css`
      :host {
        width: 100%;
        display: block;
        position: relative;
        outline: none;
      }

      :host(:focus-within) gyro-color-picker {
        display: block;
      }

      .field {
        width: 100%;
        height: 25px;
        border-radius: 6px;
        background: var(--color, #000000);
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 5px;
        cursor: pointer;
      }

      .field::after {
        content: attr(color);
      }

      gyro-color-picker {
        position: relative;
        z-index: 10000;
        width: 100%;
        box-sizing: border-box;
        padding: 6px;
        display: none;
        outline: none;
      }
    `;
  }

  render() {
    const self = this;

    self.color = self.color;
    self.colorHex = self.colorHex || "#000000";

    this.style.setProperty("--color", this.colorHex);

    return html`
      <th-color-picker
        tabindex="0"
        @input="${function (e) {
          console.log(e.target.hex);

          self.color = e.target.rgba;
          self.colorHex = e.target.hex;
          self.update();

          self.dispatchEvent(new Event("change"));
        }}"
      ></th-color-picker>
    `;
  }

  constructor() {
    super();

    this.tabIndex = 0;

    this.update({});
  }
}

customElements.define("gyro-color-field", ColorField);

export default class EmoteEditorEle extends LitElement {
  redo() {
    redo();
    this.update();
  }

  undo() {
    undo();
    this.update();
  }

  get width() {
    return stateObject.width;
  }

  get height() {
    return stateObject.height;
  }

  render() {
    const width = stateObject.width;
    const height = stateObject.height;
    const x = -stateObject.width * 0.5;
    const y = -stateObject.height * 0.5;

    const cropX = stateObject.crop[0];
    const cropY = stateObject.crop[1];
    const cropW = stateObject.crop[2];
    const cropH = stateObject.crop[3];

    const hadnleSize = 5 / stateObject.scale;

    const self = this;

    let arOptions = [
      { name: "1 / 1", value: 1 },
      { name: "free", value: 0 },
      { name: "source", value: this.getSourceAspectRatio() },
    ];

    const arButton = this.shadowRoot.querySelector("#arButton");

    if (arButton) {
      if (stateObject.ascpetRatio == 0) {
        arButton.value = { name: `free` };
      } else if (stateObject.ascpetRatio != 1 && stateObject.ascpetRatio != 0.5) {
        arButton.value = { name: `1 / ${stateObject.ascpetRatio.toFixed(1)}` };
      }
    }

    return html`
      <style>
        ${style}
      </style>

      <div class="toolbar">
        <div class="toolbar-row">
          <button
            class="tool-button holo"
            id="scale"
            title="Scale"
            @click=${(e) => this.setScale(1)}
          >
            ${Math.floor(stateObject.scale.toFixed(1) * 100)}%
          </button>
        </div>
        <div class="toolbar-row">
          <gyro-input
            placeholder="Untitled"
            value="${this.getFileName() || ""}"
            @input="${function (e) {
              self.name = this.value;
            }}"
          ></gyro-input>
        </div>
      </div>

      ${this.histogram}

      <div class="settings">
        <span class="headline">Transform</span>

        <label>Aspect Ratio</label>
        <dropdown-button
          class="holo"
          title="Aspect Ratio"
          id="arButton"
          .options="${arOptions}"
          @change="${(e) => {
            if (self.width > 0) {
              self.setAscpetRatio(+e.target.value.value);
            }
          }}"
        >
        </dropdown-button>

        <label>Rotation</label>
        <gyro-fluid-input
          class="holo"
          min="-180"
          max="180"
          value="${stateObject.rotation}"
          @change="${(e) => {
            self.setRotation(e.target.value);
          }}"
        ></gyro-fluid-input>

        <br />
        <br />

        <button class="holo" title="Flip Canvas Horizontally" @click=${(e) => self.flipCanvas()}>
          Flip Canvas
        </button>

        <span class="headline">Chroma Key</span>

        <label>Threshold</label>
        <gyro-fluid-input
          class="holo"
          min="0"
          max="1"
          value="${stateObject.chromaThreshold}"
          steps="0.001"
          @change="${function (e) {
            stateObject.chromaThreshold = e.target.value;
            self.update();
          }}"
        ></gyro-fluid-input>

        <label>Key Color</label>
        <gyro-color-field
          @change="${function (e) {
            const ele = e.target;
            stateObject.chromaKey = [ele.color[0] / 255, ele.color[1] / 255, ele.color[2] / 255];
            self.update();
          }}"
        ></gyro-color-field>

        <span class="headline">Color Correction</span>

        <label>White Balance</label>
        <gyro-fluid-input
          class="holo"
          min="-0.5"
          max="0.5"
          value="${stateObject.whitebalance}"
          steps="0.001"
          @change="${function (e) {
            stateObject.whitebalance = e.target.value;
            self.update();
          }}"
        ></gyro-fluid-input>

        <label>Brightness</label>
        <gyro-fluid-input
          class="holo"
          min="-1"
          max="1"
          steps="0.01"
          value="${stateObject.brightness}"
          steps="0.001"
          @change="${function (e) {
            stateObject.brightness = e.target.value;
            self.update();
          }}"
        ></gyro-fluid-input>

        <label>Contrast</label>
        <gyro-fluid-input
          class="holo"
          min="0"
          max="5"
          value="1"
          value="${stateObject.contrast}"
          steps="0.001"
          @change="${function (e) {
            stateObject.contrast = e.target.value;
            self.update();
          }}"
        ></gyro-fluid-input>

        <label>Saturation</label>
        <gyro-fluid-input
          class="holo"
          min="-1"
          max="1"
          value="${stateObject.saturation}"
          steps="0.001"
          @change="${function (e) {
            stateObject.saturation = e.target.value;
            self.update();
          }}"
        ></gyro-fluid-input>

        <label>Blacks</label>
        <gyro-fluid-input
          class="holo"
          min="-1"
          max="2"
          value="${stateObject.blacks}"
          steps="0.001"
          @change="${function (e) {
            stateObject.blacks = e.target.value;
            self.update();
          }}"
        ></gyro-fluid-input>

        <label>Whites</label>
        <gyro-fluid-input
          class="holo"
          min="-1"
          max="2"
          value="${stateObject.whites}"
          steps="0.001"
          @change="${function (e) {
            stateObject.whites = e.target.value;
            self.update();
          }}"
        ></gyro-fluid-input>

        <span class="headline">Background</span>

        <gyro-color-field
          @change="${function (e) {
            const ele = e.target;
            stateObject.background = ele.color;
            self.update();
          }}"
        ></gyro-color-field>
      </div>

      <div class="placeholder">
        <gyro-icon icon="Import"></gyro-icon>
        <span> Drag and drop or paste image to import. </span>
      </div>

      <svg
        class="preview"
        width="${this.clientWidth}"
        height="${this.clientHeight}"
        viewbox="${`0 0 ${this.clientWidth} ${this.clientHeight}`}"
        @wheel="${(e) => {
          this.setScale(stateObject.scale - e.deltaY * stateObject.scale * 0.001);
        }}"
      >
        <g id="origin">
          <g id="view">
            <foreignObject width="${width}" height="${height}" x="${x}" y="${y}">
              <div class="canvas-wrapper">${this.canvas}</div>
            </foreignObject>

            <mask id="cropMask">
              <rect width="${width}" height="${height}" x="${x}" y="${y}" fill="white"></rect>
              <rect
                width="${cropW}"
                id="canvasMask"
                height="${cropH}"
                x="${x + cropX}"
                y="${y + cropY}"
                fill="black"
              ></rect>
            </mask>

            <g id="crop">
              <rect
                class="border"
                id="cropArea"
                width="${cropW}"
                height="${cropH}"
                x="${x + cropX}"
                y="${y + cropY}"
              ></rect>

              <rect
                class="overlay"
                width="${width}"
                height="${height}"
                x="${x}"
                y="${y}"
                mask="url(#cropMask)"
              ></rect>

              <circle
                class="handle"
                id="handleTL"
                r="${hadnleSize}"
                cx="${x + cropX}"
                cy="${y + cropY}"
              ></circle>
              <circle
                class="handle"
                id="handleTR"
                r="${hadnleSize}"
                cx="${x + cropX + cropW}"
                cy="${y + cropY}"
              ></circle>
              <circle
                class="handle"
                id="handleBL"
                r="${hadnleSize}"
                cx="${x + cropX}"
                cy="${y + cropY + cropH}"
              ></circle>
              <circle
                class="handle"
                id="handleBR"
                r="${hadnleSize}"
                cx="${x + cropX + cropW}"
                cy="${y + cropY + cropH}"
              ></circle>
            </g>
          </g>
        </g>
      </svg>
    `;
  }

  update(args) {
    super.update(args);

    this.draw();

    this.style.setProperty("--s", stateObject.scale);
    this.style.setProperty("--r", stateObject.rotation);
    this.style.setProperty("--x", stateObject.origin.x + "px");
    this.style.setProperty("--y", stateObject.origin.y + "px");

    this.handles = [
      this.shadowRoot.querySelector("#handleTL"),
      this.shadowRoot.querySelector("#handleTR"),
      this.shadowRoot.querySelector("#handleBL"),
      this.shadowRoot.querySelector("#handleBR"),
      this.shadowRoot.querySelector("#cropArea"),
    ];

    for (let handle of this.handles) {
      let start = [0, 0];
      let startCrop = [...stateObject.crop];

      handle.onmousedown = (e) => {
        if (!e.button == 0) return;

        start = [e.x, e.y];

        this.onmousemove = (e) => {
          let delta = [
            e.x / stateObject.scale - start[0] / stateObject.scale,
            e.y / stateObject.scale - start[1] / stateObject.scale,
          ];

          if (e.shiftKey) {
            if (Math.abs(delta[0]) > Math.abs(delta[1])) {
              delta[1] = 0;
            } else {
              delta[0] = 0;
            }
          }

          if (e.ctrlKey) {
            stateObject.fixedRatio = false;
          } else {
            stateObject.fixedRatio = true;
          }

          if (handle.id == "handleTL") {
            this.setCrop(
              startCrop[0] + delta[0],
              startCrop[1] + delta[1],
              startCrop[2] - delta[0],
              startCrop[3] - delta[1]
            );
          }

          if (handle.id == "handleTR") {
            this.setCrop(
              null,
              startCrop[1] + delta[1],
              startCrop[2] + delta[0],
              startCrop[3] - delta[1]
            );
          }

          if (handle.id == "handleBL") {
            this.setCrop(
              startCrop[0] + delta[0],
              null,
              startCrop[2] - delta[0],
              startCrop[3] + delta[1]
            );
          }

          if (handle.id == "handleBR") {
            this.setCrop(null, null, startCrop[2] + delta[0], startCrop[3] + delta[1]);
          }

          if (handle.id == "cropArea") {
            this.setCrop(startCrop[0] + delta[0], startCrop[1] + delta[1], null, null);
          }

          this.update();
        };
      };
      this.onmouseup = (e) => {
        this.onmousemove = null;
        stateObject.fixedRatio = true;
      };
    }

    this.dispatchEvent(new Event("change"));
  }

  loadImage(image, name) {
    stateObject.source = image;
    this.name = name;

    this.setResolution(image.width, image.height);

    const x = Math.max(image.width, image.height);
    let deltaScale = 1;

    if (x == image.width) {
      deltaScale = window.innerWidth / x;
    }
    if (x == image.height) {
      deltaScale = window.innerHeight / x;
    }

    deltaScale = Math.min(deltaScale - 0.05, 1.0);

    this.setScale(deltaScale);

    this.update();

    this.removeAttribute("empty", "");
  }

  setCrop(x, y, width, height) {
    const prevCrop = [...stateObject.crop];

    stateObject.crop[0] = x != null ? x : prevCrop[0];
    stateObject.crop[1] = y != null ? y : prevCrop[1];
    stateObject.crop[2] = width != null ? width : prevCrop[2];
    stateObject.crop[3] = height != null ? height : prevCrop[3];

    stateObject.crop[2] = Math.max(stateObject.crop[2], stateObject.minResolution[0]);
    stateObject.crop[3] = Math.max(stateObject.crop[3], stateObject.minResolution[1]);

    if (stateObject.fixedRatio && stateObject.ascpetRatio !== 0) {
      const croppedAr = stateObject.crop[2] / stateObject.crop[3];

      const preArHeight = stateObject.crop[3];
      const preArWidth = stateObject.crop[2];

      stateObject.crop[2] = stateObject.crop[2];
      stateObject.crop[3] = stateObject.crop[3] * (croppedAr * stateObject.ascpetRatio);

      if (stateObject.crop[1] != prevCrop[1]) {
        stateObject.crop[1] += preArHeight - stateObject.crop[3];
      }
      if (stateObject.crop[0] != prevCrop[0]) {
        stateObject.crop[0] += preArWidth - stateObject.crop[2];
      }
    }

    stateObject.crop = stateObject.crop.map((v) => Math.floor(v));

    if (!stateObject.fixedRatio) {
      stateObject.ascpetRatio = height / width;
    }

    this.update();

    this.dispatchEvent(new Event("change"));
  }

  setScale(scale) {
    stateObject.scale = Math.max(scale, 0.1);
    this.update();
  }

  setRotation(deg) {
    stateObject.rotation = deg;
    this.update();

    this.dispatchEvent(new Event("change"));
  }

  setResolution(width, height) {
    stateObject.width = width;
    stateObject.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    this.setCrop(0, 0, stateObject.width, stateObject.height);
  }

  setAscpetRatio(ar) {
    stateObject.ascpetRatio = ar;
    this.setCrop(0, 0, stateObject.width, stateObject.height);
  }

  flipCanvas() {
    stateObject.flip = !stateObject.flip;

    this.draw();

    this.dispatchEvent(new Event("change"));
  }

  constructor() {
    super();

    stateObject.source = null;

    stateObject.flip = false;
    stateObject.fixedRatio = true;
    stateObject.ascpetRatio = 1.0;
    stateObject.minResolution = [18, 18];
    stateObject.origin = { x: 0, y: 0 };
    stateObject.crop = [0, 0, 0, 0];
    stateObject.width = 0;
    stateObject.height = 0;
    stateObject.scale = 1;
    stateObject.rotation = 0;

    this.setAttribute("empty", "");

    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");

    this.addEventListener("mousedown", (e) => {
      this.addEventListener("mousemove", mouseDrag);
    });

    this.addEventListener("mouseup", () => {
      this.removeEventListener("mousemove", mouseDrag);
    });

    window.addEventListener("resize", (e) => this.update());
    window.addEventListener("layout", (e) => this.update());

    const mouseDrag = (e) => {
      if (e.buttons == 4) {
        stateObject.origin.x += e.movementX / stateObject.scale;
        stateObject.origin.y += e.movementY / stateObject.scale;

        this.update();
      }
    };

    const state = loadStateFromLocal();

    if (state && state.source) {
      new Gyro.Notification({
        text: `
                    <div style="display: flex; align-items: center;">
                        <gyro-icon icon="Save" style="display: inline-block; margin-right: 10px;"></gyro-icon>
                        Click here to load last save.
                    </div>
                `,
        time: 1000 * 5,
        onclick: () => {
          this.loadImage(state.source);
          setState(state);
          this.update();

          this.dispatchEvent(new Event("change"));
        },
      }).show();
    }

    this.addEventListener("mousedown", () => {
      if (stateObject.source) {
        pushStateHistory();
      }
    });

    const chat = document.querySelector("twitch-chat");

    window.addEventListener("preview.update", (e) => {
      chat.updateEmotes(this.renderOutput());
    });

    this.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    this.addEventListener("change", (e) => {
      chat.updateEmotes(this.renderOutput());
    });
  }

  draw() {
    const imageSource = stateObject.source;

    if (imageSource) {
      const image = preprocess(imageSource);

      this.context.clearRect(0, 0, stateObject.width, stateObject.height);

      if (stateObject.background && stateObject.background[3] > 0) {
        const c = stateObject.background;
        this.context.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
        this.context.fillRect(0, 0, stateObject.width, stateObject.height);
      }

      this.context.save();

      if (stateObject.flip) {
        this.context.scale(-1, 1);
        this.context.drawImage(image, -stateObject.width, 0);
      } else {
        this.context.drawImage(image, 0, 0);
      }

      this.context.restore();
    }
  }

  getSourceAspectRatio() {
    if (stateObject.source) {
      return stateObject.source.height / stateObject.source.width;
    }
    return 1;
  }

  getFileName() {
    return this.name;
  }

  renderOutput() {
    const imageSource = this.canvas;

    const canvas = document.createElement("canvas");
    canvas.width = stateObject.width;
    canvas.height = stateObject.height;
    const context = canvas.getContext("2d");
    context.save();

    // recreate transforms
    context.scale(
      stateObject.width / stateObject.crop[2],
      stateObject.height / stateObject.crop[3]
    );
    context.translate(canvas.width / 2, canvas.height / 2);
    context.translate(-stateObject.crop[0], -stateObject.crop[1]);
    context.rotate((stateObject.rotation * Math.PI) / 180);

    context.drawImage(imageSource, -canvas.width / 2, -canvas.height / 2);

    context.restore();
    return canvas;
  }
}

customElements.define("gyro-emote-editor", EmoteEditorEle);
