import { html, css, LitElement } from 'lit';

function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

interface FluidInputProps {}

export default class FluidInput extends LitElement {
  internalValue = 400;

  internalMin = 100;

  internalMax = 600;

  internalSteps = 10;

  input: HTMLInputElement | undefined | null;

  inputValue: HTMLInputElement | undefined | null;

  valueContainer: HTMLInputElement | undefined | null;

  leftArrow: Element | undefined | null;

  rightArrow: Element | undefined | null;

  static get properties() {
    return {
      value: {
        type: Number,
      },
      min: {
        type: Number,
      },
      max: {
        type: Number,
      },
      steps: {
        type: Number,
      },
    };
  }

  get value() {
    return this.internalValue;
  }

  set value(val) {
    this.internalValue = +val;
    this.updateValue();
  }

  get min() {
    return this.internalMin;
  }

  set min(val) {
    this.internalMin = +val;
    this.updateValue();
  }

  get max() {
    return this.internalMax;
  }

  set max(val) {
    this.internalMax = +val;
    this.updateValue();
  }

  get steps() {
    return this.internalSteps;
  }

  set steps(val) {
    this.internalSteps = +val;
    this.updateValue();
  }

  get suffix() {
    return this.getAttribute('suffix');
  }

  get isRange() {
    return this.max || this.min;
  }

  connectedCallback(): void {
    super.connectedCallback();

    requestAnimationFrame(() => {
      this.input = this.shadowRoot?.querySelector('.input-container') as HTMLInputElement;
      this.inputValue = this.shadowRoot?.querySelector('.input-value') as HTMLInputElement;

      this.valueContainer = this.shadowRoot?.querySelector('.value-container') as HTMLInputElement;

      this.leftArrow = this.shadowRoot?.querySelector('.left-arrow');
      this.rightArrow = this.shadowRoot?.querySelector('.right-arrow');

      this.registerHandlers();
      this.updateValue();
    });
  }

  updateValue() {
    if (this.isRange && this.input != null) {
      this.input.style.setProperty('--value', map(this.value, this.min, this.max, 0, 1).toString());
    }

    const getPrecision = (n: number) => {
      const precParts = n.toString().split('.');
      const size = precParts[1] ? precParts[1].length : 0;

      // return 0 if precision is smaller then .000
      if (precParts[1] && precParts[1].substring(0, 3) === '000') {
        return 0;
      }

      return size;
    };

    const valuePrecision = getPrecision(this.value);
    const stepsPrecision = getPrecision(this.steps);

    const precision = valuePrecision > stepsPrecision ? stepsPrecision : valuePrecision;

    if (this.inputValue) {
      this.inputValue.value = this.value.toFixed(precision);
      this.inputValue.size = this.inputValue.value.length;
    }
  }

  setValue(value: number) {
    const latValue = this.value;

    if (this.isRange) {
      this.value = Math.min(Math.max(value, this.min), this.max);
    } else {
      this.value = value;
    }

    this.dispatchEvent(new CustomEvent('change', { detail: this.value - latValue }));
  }

  registerHandlers() {
    let startPos: [number, number] | null = null;
    let startMovePos: [number, number] | null = null;
    let startValue = this.value;
    let focused = false;

    const cancel = () => {
      startPos = null;
      startMovePos = null;
      if (this.input) {
        this.input.removeAttribute('active');
      }
    };

    if (this.valueContainer) {
      this.valueContainer.addEventListener('click', (e) => {
        if (this.inputValue) {
          this.inputValue.disabled = false;
          focused = true;

          this.setAttribute('active', '');

          this.inputValue.focus();
        }
      });
    }

    const up = () => {
      cancel();
    };
    const start = (e: TouchEvent | MouseEvent) => {
      let x = 0;
      let y = 0;

      if (e instanceof MouseEvent) {
        x = e.clientX;
        y = e.clientY;
      } else {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      }

      if (!focused) {
        startPos = [x, y];
        startValue = this.value;
        if (this.input) {
          this.input.setAttribute('active', '');
        }
        e.preventDefault();
      }
    };
    const move = (e: TouchEvent | MouseEvent) => {
      let x = 0;
      let y = 0;

      if (e instanceof MouseEvent) {
        x = e.clientX;
        y = e.clientY;
      } else {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      }

      if (startPos) {
        if (Math.abs(x - startPos[0]) > 10) {
          startMovePos = [x, y];
        }
      }
      if (startMovePos && startPos) {
        // apply shift key scaler
        let scale = e.shiftKey ? 0.0005 : 0.005;
        // scale to min max range
        if (this.max - this.min > 0) {
          scale *= (this.max - this.min) / 1;
        }

        // set value by absolute delta movement * scale
        let absolute = startValue + (x - startPos[0]) * scale;
        // apply steps
        absolute -= absolute % this.steps;

        this.setValue(absolute);
        e.preventDefault();
      }
    };

    const cancelInput = () => {
      this.setValue(this.value);
      if (!this.inputValue) return;
      this.inputValue.disabled = true;
      focused = false;
      this.removeAttribute('active');
    };

    const submit = () => {
      if (!this.inputValue) return;

      if (Number.isNaN(this.inputValue.value)) {
        try {
          const evalValue = +this.inputValue.value;
          this.setValue(evalValue);
        } catch (err) {
          console.log(err);
        }

        cancelInput();
      } else {
        const evalValue = eval(this.inputValue.value);
        this.setValue(parseFloat(evalValue));
        this.inputValue.disabled = true;
        this.removeAttribute('active');
        focused = false;
      }
    };

    const input = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        submit();
      } else if (e.key === 'Escape') {
        cancelInput();
      }
    };

    if (this.inputValue && this.input && this.rightArrow && this.leftArrow) {
      this.inputValue.addEventListener('blur', submit);
      this.inputValue.addEventListener('keydown', input);

      // mouse
      this.input.addEventListener('mousedown', start);
      window.addEventListener('mousemove', move);

      // touch
      this.input.addEventListener('touchstart', start);
      window.addEventListener('touchmove', move);

      // touch
      window.addEventListener('touchend', up);
      window.addEventListener('touchcancel', up);

      // mouse
      window.addEventListener('mouseup', up);
      window.addEventListener('mousecancel', up);
      window.addEventListener('mouseleave', up);

      this.leftArrow.addEventListener('click', (e) => {
        this.setValue(this.value - this.steps);
        e.preventDefault();
      });
      this.rightArrow.addEventListener('click', (e) => {
        this.setValue(this.value + this.steps);
        e.preventDefault();
      });
    }

    // touch
    this.addEventListener('touchstart', (e) => {
      if (!startPos && !focused) {
        e.preventDefault();
      }
    });

    // mouse
    this.addEventListener('mousedown', (e) => {
      if (!startPos && !focused) {
        e.preventDefault();
      }
    });
  }

  static get styles() {
    return css`
      :host {
        display: inline-block;
        height: 28px;

        --color-input-background: #111;
        --color-input-hover-background: #121212;
        --color-input-active-background: #121212;
        --value-background-color: #27272A;
        --color-input-focus-color: #222;
      }

      .input-container {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--color-input-background);
        border-radius: 4px;
        cursor: ew-resize;
        position: relative;
        overflow: hidden;
        border: 1px solid transparent;
      }

      .input-container:before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: calc(100% * var(--value));
        pointer-events: none;
        background: var(--value-background-color);
        opacity: 0.75;
      }

      .input-container:hover {
        background: var(--color-input-hover-background);
      }

      .input-container[active] {
        background: var(--color-input-active-background);
        border-color: var(--color-input-focus-color);
      }

      .value-container {
        white-space: nowrap;
        height: 100%;
      }

      .input-value {
        cursor: ew-resize;
        height: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        margin: 0;
        width: auto;
        padding: 0;
        color: inherit;
        font-family: inherit;
        font-size: inherit;
        text-align: center;
        position: relative;
        z-index: 1000;
      }

      .input-value:focus {
        cursor: text;
      }

      .value-suffix {
        opacity: 0.5;
        pointer-events: none;
      }

      :host([active]) .value-suffix {
        display: none;
      }

      .input-value:focus {
        outline: none;
        cursor: text;
      }

      .arrow {
        padding: 0 6px;
        height: 100%;
        display: flex;
        align-items: center;
        cursor: pointer;
        opacity: 0.75;
        position: absolute;
      }

      .left-arrow {
        left: 0;
      }
      .right-arrow {
        right: 0;
      }

      .arrow:hover {
        background: rgba(0, 0, 0, 0.1);
      }

      .arrow:active {
        background: rgba(255, 255, 255, 0.25);
      }

      .arrow svg {
        fill: none;
        stroke: #fff;
        stroke-width: 1.25px;
        stroke-linecap: round;
      }
    `;
  }

  render() {
    return html`
      <div class="input-container">
          <span class="arrow left-arrow">
              <svg x="0px" y="0px" width="7.3px" height="11px" viewBox="0 0 7.3 12.5">
                  <polyline class="st0" points="6.3,1 1,6.3 6.3,11.5 "/>
              </svg>
          </span>
          <span class="value-container">
              <input class="input-value"></input>
              ${this.suffix ? html` <span class="value-suffix">${this.suffix}</span> ` : ''}
          </span>
          <span class="arrow right-arrow">
              <svg x="0px" y="0px" width="7.3px" height="11px" viewBox="0 0 7.3 12.5">
                  <polyline class="st0" points="1,11.5 6.3,6.3 1,1 "/>
              </svg>
          </span>
      </div>
    `;
  }
}

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'fluid-input': HTMLAttributes<HTMLDivElement> & FluidInputProps & IntrinsicAttributes;
    }
  }
}

customElements.define('fluid-input', FluidInput);
