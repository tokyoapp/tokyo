import { html, render } from "https://unpkg.com/lit-html@1.3.0/lit-html.js";

function map(value, in_min, in_max, out_min, out_max) {
  return ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

export default class Knob extends HTMLElement {
  template() {
    return html`
      <style>
        :host {
          display: inline-block;
          --color-knob: #404040;
          --color-knob-border: #212121;
          --color-knob-indicator: #eee;
          --color-ring: #0c0c0c;
          --color-ring-filled: lime;
        }
        .knob-container {
          position: relative;
          margin: 5px 0 8px 0;
        }
        .knob {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 8px 5px rgba(0, 0, 0, 0.1);
        }
        .knob:hover::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 50%;
          opacity: 0.03;
          pointer-events: none;
        }
        .knob-handle {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--color-knob);
          border: 2px solid var(--color-knob-border);
          position: relative;
          transform: rotate(calc(270deg * var(--value)));
        }
        :host([active]) .knob-handle {
          border: 2px solid var(--color-knob-indicator);
        }
        .knob-handle::after {
          content: "";
          border-radius: 3px;
          position: absolute;
          bottom: 50%;
          left: 50%;
          transform-origin: 50% 100%;
          transform: rotate(-135deg) translate(50%, -150%);
          border: 2px solid white;
          // width: 2px;
          // height: 10px;
          background: white;
        }
        .knob-ring {
        }
        .knob-display {
          display: block;
          width: 50px;
          height: 50px;
        }
        .knob-value {
          text-align: center;
          position: absolute;
          bottom: -6px;
          left: 0;
          width: 100%;
          font-size: 9px;
          opacity: 0.75;
        }
        .knob-value::after {
          content: attr(value);
          display: inline;
        }
        slot {
          display: block;
          text-align: center;
        }
      </style>
      <slot></slot>
      <div class="knob-container">
        <div class="knob">
          <div class="knob-handle"></div>
        </div>
        <div class="knob-ring">
          <canvas class="knob-display"></canvas>
          <div class="knob-value"></div>
        </div>
      </div>
    `;
  }

  static get observedAttributes() {
    return ["value", "min", "max", "steps", "offset"];
  }

  get value() {
    return this._value;
  }
  set value(val) {
    this._value = +val;
    this.update();
  }

  get min() {
    return this._min;
  }
  set min(val) {
    this._min = +val;
    this.update();
  }

  get max() {
    return this._max;
  }
  set max(val) {
    this._max = +val;
    this.update();
  }

  get steps() {
    return this._steps;
  }
  set steps(val) {
    this._steps = +val;
    this.update();
  }

  get offset() {
    return this._offset;
  }
  set offset(val) {
    this._offset = +val;
    this.update();
  }

  constructor() {
    super();

    this._value = 0;
    this._min = 0;
    this._max = 100;
    this._steps = 1;
    this._offset = 0;

    this.attachShadow({ mode: "open" });
    this.render();

    this._ringColor = "rgba(0, 0, 0, 0.25)";
    this._ringColorFilled = "lime";

    this.knob = this.shadowRoot.querySelector(".knob-container");
    this.knobValue = this.shadowRoot.querySelector(".knob-value");
    this.knobHandle = this.shadowRoot.querySelector(".knob-handle");

    const display = this.shadowRoot.querySelector(".knob-display");
    this.displayContext = display.getContext("2d");

    this.registerHandlers();
    this.update();
  }

  registerHandlers() {
    let startPos = null;
    let startValue = this.value;

    const cancel = () => {
      startPos = null;
      this.removeAttribute("active");
    };
    const start = (e) => {
      startPos = [e.x, e.y];
      startValue = this.value;
      this.setAttribute("active", "");
    };
    const move = (e) => {
      if (startPos) {
        // apply shift key scaler
        let scale = e.shiftKey ? 0.0005 : 0.005;
        // scale to min max range
        scale *= this.max - this.min;

        // set value by absolute delta movement * scale
        let absolute = startValue - (e.y - startPos[1]) * scale;
        // apply steps
        absolute = absolute - (absolute % this.steps);

        this.setValue(absolute);
        e.preventDefault();
      }
    };

    this.knobHandle.addEventListener("mousedown", start);
    window.addEventListener("mousemove", move);

    window.addEventListener("mouseup", cancel);
    window.addEventListener("mousecancel", cancel);
    window.addEventListener("mouseleave", cancel);

    this.addEventListener("dblclick", (e) => {
      this.setValue(+this.getAttribute("value"));
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name == "value") {
      this.setValue(newValue);
    }
    if (name == "min") {
      this.min = +newValue;
    }
    if (name == "max") {
      this.max = +newValue;
    }
    if (name == "steps") {
      this.steps = +newValue;
    }
    if (name == "offset") {
      this.offset = +newValue;
    }

    this.update();
  }

  drawDisplay() {
    const ctx = this.displayContext;

    ctx.canvas.width = 50;
    ctx.canvas.height = 50;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.lineWidth = 2.5;

    const r = width / 2 - 2.5;

    ctx.strokeStyle = this._ringColor;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, r, (Math.PI / 4) * 3, (Math.PI / 4) * 3 * 3);
    ctx.stroke();

    const prog = map(this.value, this.min, this.max, 0, 1);

    let start = (Math.PI / 4) * 3 + this.offset * ((Math.PI / 4) * 3);
    let end = (Math.PI / 4) * 3 * (2 * prog + 1);

    ctx.strokeStyle = this._ringColorFilled;
    ctx.beginPath();
    if (end < start) {
      ctx.arc(width / 2, height / 2, r, end, start);
    } else {
      ctx.arc(width / 2, height / 2, r, start, end);
    }
    ctx.stroke();
  }

  update() {
    this.knob.style.setProperty(
      "--value",
      map(this.value, this.min, this.max, 0, 1)
    );

    const precParts = this.steps.toString().split(".");
    const precision = precParts[1] ? precParts[1].length : 0;
    this.knobValue.setAttribute("value", this.value.toFixed(precision));

    this.drawDisplay();
  }

  setValue(value) {
    this.value = Math.min(Math.max(value, this.min), this.max);

    this.dispatchEvent(new Event("change"));
  }

  render() {
    render(this.template(), this.shadowRoot);
  }
}

customElements.define("gyro-knob", Knob);
