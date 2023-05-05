import { LitElement, css, html } from "lit";
import { property } from "lit/decorators.js";

export class OptionElement extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }
    `;
  }

  @property({ type: String, reflect: true })
  public value!: string;

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sv-option": OptionElement;
  }
}

customElements.define("sv-option", OptionElement);
