import { css, html, LitElement } from "lit";

export default class Button extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-block;
      }

      button {
        color: inherit;
        border: none;
        padding: 8px 12px;
        min-width: 80px;
        border-radius: 6px;
        background: #1c1c1c;
        cursor: pointer;
        border: 1px solid #333;
      }

      button:hover {
        background: #333;
      }
      button:active {
        background: #1c1c1c;
      }
    `;
  }

  render() {
    return html`<button><slot></slot></button>`;
  }
}

customElements.define("evo-button", Button);

declare global {
  interface HTMLElementTagNameMap {
    "evo-button": Button;
  }
}
