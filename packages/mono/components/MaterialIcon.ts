import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";

const TAG = "material-icon";

document.head.innerHTML += `<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">`;

export class MaterialIcon extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }

      @font-face {
        font-family: "Material Icons";
        font-style: normal;
        font-weight: 400;
        src: url(https://fonts.gstatic.com/s/materialicons/v138/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2)
          format("woff2");
        font-display: block;
      }

      .material-icons {
        font-family: "Material Icons", none;
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -webkit-font-feature-settings: "liga";
        -webkit-font-smoothing: antialiased;
      }
    `;
  }

  @property({ type: String })
  public icon?: string;

  render() {
    return html` <span class="material-icons md-24">${this.icon}</span> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: MaterialIcon;
  }
}

if (!customElements.get(TAG)) {
  customElements.define(TAG, MaterialIcon);
} else {
  console.warn(`Custom element "${TAG}" already defined.`);
}
