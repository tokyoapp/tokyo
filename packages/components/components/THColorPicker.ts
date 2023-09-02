import { css, html, LitElement } from 'lit-element';

function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// http://hsl2rgb.nichabi.com/javascript-function.php
function hsl2rgb(h, s, l) {
  var r, g, b, m, c, x;

  h *= 360;
  s *= 100;
  l *= 100;

  if (!isFinite(h)) h = 0;
  if (!isFinite(s)) s = 0;
  if (!isFinite(l)) l = 0;

  h /= 60;
  if (h < 0) h = 6 - (-h % 6);
  h %= 6;

  s = Math.max(0, Math.min(1, s / 100));
  l = Math.max(0, Math.min(1, l / 100));

  c = (1 - Math.abs(2 * l - 1)) * s;
  x = c * (1 - Math.abs((h % 2) - 1));

  if (h < 1) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 2) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 3) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 4) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 5) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  m = l - c / 2;
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b];
}

// https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
function rgb2hsl(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h,
    s,
    l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

export default class ColorPicker extends LitElement {
  render() {
    return html`
      <style>
        :host {
          display: block;
          -webkit-user-drag: none;
          user-select: none;
          padding: 15px;
          width: 185px;
          border-radius: 6px;
          background: var(--gyro-pallate-panel-content);
          box-sizing: border-box;
          margin-right: 0;
          width: 100%;

          --cursor-width: 10px;
          --bar-height: 15px;

          --hue: 100;
          --saturation: 100;
          --lightness: 100;
          --alpha: 100;
        }

        .color-picker {
          display: grid;
          grid-gap: 5px;

          --h: calc(var(--hue) * 3.6);
          --s: calc(var(--saturation) * 1%);
          --l: calc(var(--lightness) * 1%);
          --a: calc(var(--alpha) * 1%);
        }

        .color-bar {
          position: relative;
          height: var(--bar-height);
        }

        .color-bar-cursor {
          position: absolute;
          top: -1px;
          left: 0;
          height: 110%;
          width: var(--cursor-width);
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
          transform: translateX(-50%);
          z-index: 100;
          box-sizing: border-box;
          border-radius: 2px;
          cursor: pointer;
        }

        .color {
          height: 100%;
          width: 100%;
          display: flex;
        }

        .color canvas {
          width: 20px;
        }

        .colorValue {
          display: flex;
        }

        .colorValue label {
          font-size: 12px;
          line-height: 100%;
          opacity: 0.5;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 5px;
          text-transform: uppercase;
        }

        .colorValue input {
          display: flex;
          width: 20%;
          text-align: center;
          background: transparent;
          border: none;
          color: #eee;
          padding: 6px 3px;
          font-size: 12px;
          margin-right: 5px;
          border-radius: 3px;
        }

        .colorValue input:focus,
        .colorValue input:hover {
          background: rgba(0, 0, 0, 0.25);
        }

        .transition .color-bar-cursor {
          transition: left 0.15s ease-out;
        }

        canvas {
          width: 100%;
          height: 100%;
          background: grey;
          display: block;
          border-radius: 4px;
        }

        .transition canvas {
          transition: background 0.125s ease-out;
        }

        .color-bar.hue .color-bar-cursor {
          left: calc(var(--hue) * 1%);
          background: hsl(var(--h), 100%, 50%);
        }

        .color-bar.saturation .color-bar-cursor {
          left: var(--s);
          background: hsl(var(--h), var(--s), 50%);
        }

        .color-bar.lightness .color-bar-cursor {
          left: var(--l);
          background: hsl(0, 0%, var(--l));
        }

        .color-bar.alpha .color-bar-cursor {
          left: var(--a);
          background: hsla(var(--h), var(--s), var(--l), var(--a));
        }

        .color-bar.saturation canvas {
          background: linear-gradient(
            90deg,
            hsl(var(--h), 0%, var(--l)),
            hsl(var(--h), 100%, var(--l))
          );
        }

        .color-bar.lightness canvas {
          background: linear-gradient(
            90deg,
            hsl(var(--h), var(--s), 0%),
            hsl(var(--h), var(--s), 100%)
          );
        }

        .color-bar.alpha canvas {
          background: linear-gradient(
            90deg,
            hsla(var(--h), var(--s), var(--l), 0),
            hsla(var(--h), var(--s), var(--l), 1)
          );
        }

        .color-bar.color canvas {
          background: hsla(var(--h), var(--s), var(--l), var(--a));
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      </style>

      <div class="color-picker">
        <div class="color-bar hue">
          <span class="color-bar-cursor"></span>
          <canvas></canvas>
        </div>

        <div class="color-bar saturation">
          <span class="color-bar-cursor"></span>
          <canvas></canvas>
        </div>

        <div class="color-bar lightness">
          <span class="color-bar-cursor"></span>
          <canvas></canvas>
        </div>

        <div class="color-bar alpha">
          <span class="color-bar-cursor"></span>
          <canvas></canvas>
        </div>

        <div class="color-bar color">
          <div class="colorValue">
            <label>rgba</label>
            <input type="number" id="red" />
            <input type="number" id="green" />
            <input type="number" id="blue" />
            <input type="number" id="alpha" />
          </div>
        </div>
      </div>
    `;
  }

  get hsla() {
    return [this.hue * 3.6, this.saturation, this.lightness, this.alpha / 100];
  }

  get rgba() {
    const hsl = this.hsla;
    const rgb = hsl2rgb(hsl[0] / 360, hsl[1] / 100, hsl[2] / 100);
    return [...rgb, hsl[3]];
  }

  set hue(hue) {
    this._hue = Math.max(Math.min(hue, 100), 0);
    this.style.setProperty('--hue', this._hue);
    this.drawHueScale();
  }
  get hue() {
    return this._hue;
  }

  set saturation(saturation) {
    this._saturation = Math.max(Math.min(saturation, 100), 0);
    this.style.setProperty('--saturation', this._saturation);
    this.drawHueScale();
  }
  get saturation() {
    return this._saturation;
  }

  set lightness(lightness) {
    this._lightness = Math.max(Math.min(lightness, 100), 0);
    this.style.setProperty('--lightness', this._lightness);
    this.drawHueScale();
  }
  get lightness() {
    return this._lightness;
  }

  set alpha(alpha) {
    this._alpha = Math.max(Math.min(alpha, 100), 0);
    this.style.setProperty('--alpha', this._alpha);
    this.drawHueScale();
  }
  get alpha() {
    return this._alpha;
  }

  get hex() {
    return rgbToHex(this.rgba[0], this.rgba[1], this.rgba[2]);
  }

  constructor() {
    super();

    this.update();

    this.hue = 0;
    this.saturation = 50;
    this.lightness = 50;
    this.alpha = 0;

    this.moving = false;
    this.selected = null;

    const hue = this.shadowRoot.querySelector('.color-bar.hue');
    const sat = this.shadowRoot.querySelector('.color-bar.saturation');
    const light = this.shadowRoot.querySelector('.color-bar.lightness');
    const alpha = this.shadowRoot.querySelector('.color-bar.alpha');
    const color = this.shadowRoot.querySelector('.color-bar.color');

    const mousemove = (e) => {
      const box = hue.getBoundingClientRect();
      const x = Math.max((Math.min(e.x - box.left, box.width) / box.width) * 100, 0);

      this[this.selected] = x;

      this.dispatchEvent(new Event('input'));
    };

    this.addEventListener('mousedown', () => {
      this.moving = true;
      window.addEventListener('mousemove', mousemove);
    });

    window.addEventListener('mouseup', () => {
      this.moving = false;
      window.removeEventListener('mousemove', mousemove);

      this.dispatchEvent(new Event('change'));
    });

    this.addEventListener('wheel', (e) => {
      const dir = Math.sign(e.deltaY);
      this[this.selected] = this[this.selected] + dir * 1;

      this.dispatchEvent(new Event('change'));
    });

    hue.addEventListener('mousemove', () => {
      if (!this.moving) this.selected = 'hue';
    });
    sat.addEventListener('mousemove', () => {
      if (!this.moving) this.selected = 'saturation';
    });
    light.addEventListener('mousemove', () => {
      if (!this.moving) this.selected = 'lightness';
    });
    alpha.addEventListener('mousemove', () => {
      if (!this.moving) this.selected = 'alpha';
    });
    color.addEventListener('mousemove', () => {
      this.selected = null;
    });

    this.drawHueScale();

    this.shadowRoot.querySelector('#red').oninput = (e) => {
      const rgba = this.rgba;
      this.setRGBA([e.target.value, rgba[1], rgba[2], rgba[3]]);
    };
    this.shadowRoot.querySelector('#green').oninput = (e) => {
      const rgba = this.rgba;
      this.setRGBA([rgba[0], e.target.value, rgba[2], rgba[3]]);
    };
    this.shadowRoot.querySelector('#blue').oninput = (e) => {
      const rgba = this.rgba;
      this.setRGBA([rgba[0], rgba[1], e.target.value, rgba[3]]);
    };
    this.shadowRoot.querySelector('#alpha').oninput = (e) => {
      const rgba = this.rgba;
      this.setRGBA([rgba[0], rgba[1], rgba[2], e.target.value]);
    };
  }

  setHSLA(hsla) {
    this.shadowRoot.querySelector('.color-picker').classList.add('transition');

    this.hue = hsla[0] / 3.6;
    this.saturation = hsla[1];
    this.lightness = hsla[2];
    this.alpha = hsla[3] * 100;

    setTimeout(() => {
      this.shadowRoot.querySelector('.color-picker').classList.remove('transition');
    }, 15);
  }

  setRGBA(rgba) {
    const hsl = rgb2hsl(rgba[0], rgba[1], rgba[2]);
    this.setHSLA([...hsl, rgba[3]]);
  }

  drawHueScale() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 360;
    canvas.height = 1;

    for (let x = 0; x < canvas.width; x++) {
      context.fillStyle = `hsl(${x}, ${this.saturation}%, ${this.lightness}%)`;
      context.fillRect(x, 0, 1, canvas.height);
    }

    const hueCanvas = this.shadowRoot.querySelector('.color-bar.hue canvas');
    const hueContext = hueCanvas.getContext('2d');
    hueContext.drawImage(canvas, 0, 0, hueCanvas.width, hueCanvas.height);

    const rgba = this.rgba;

    this.shadowRoot.querySelector('#red').value = rgba[0];
    this.shadowRoot.querySelector('#green').value = rgba[1];
    this.shadowRoot.querySelector('#blue').value = rgba[2];
    this.shadowRoot.querySelector('#alpha').value = rgba[3];
  }
}

customElements.define('th-color-picker', ColorPicker);
