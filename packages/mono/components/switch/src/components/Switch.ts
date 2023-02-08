import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators";

@customElement("input-switch")
export default class Switch extends LitElement {
  static get styles() {
    return css`
      :host {
        --button-size: 16px;
        --global-font-color: #eee;

        border-radius: 100px;
        overflow: hidden;
        cursor: pointer;
        width: calc(var(--button-size) * 2);
        display: inline-block;
      }
      :host([checked]) .switch-handle {
        transform: translateX(100%);
      }
      .switch {
        z-index: 1;
        position: relative;
      }
      .switch:active .switch-handle-thumb {
        filter: brightness(0.95);
      }
      .switch-handle {
        height: var(--button-size);
        width: var(--button-size);
        position: relative;
        transition: transform 0.15s cubic-bezier(0.38, 0, 0.08, 1.01);
      }
      .switch-handle::after,
      .switch-handle::before {
        content: "";
        top: 0;
        height: 100%;
        position: absolute;
        width: calc(var(--button-size) * 2);
      }
      .switch-handle::after {
        left: 50%;
        background: #c4c4c4;
      }
      .switch-handle::before {
        right: 50%;
        background: var(--accent-color);
      }
      .switch-handle-thumb {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        position: relative;
        z-index: 1000;
        background: var(--global-font-color);
      }
    `;
  }

  static get properties() {
    return {
      checked: {},
    };
  }

  get checked() {
    return this.hasAttribute("checked") && this.getAttribute("checked") != "false";
  }

  set checked(value) {
    if (value === false) {
      this.removeAttribute("checked");
    } else if (value === true) {
      this.setAttribute("checked", "");
    }
  }

  get value() {
    return this.checked ? 1 : 0;
  }

  set value(val: number) {
    this.checked = val === 0 ? false : true;
  }

  render() {
    const clickHandler = () => {
      this.checked = !this.checked;
      this.dispatchEvent(new Event("change", { bubbles: true }));
    };

    return html`
      <div class="switch" @click=${clickHandler}>
        <div class="switch-handle">
          <div class="switch-handle-thumb"></div>
        </div>
      </div>
    `;
  }
}
