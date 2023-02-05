import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";
import Actions from "core/actions";

export default class ActionButton extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-block;
      }
    `;
  }

  @property({ type: String, reflect: true })
  public action!: string;

  onClick() {
    Actions.run(this.action);
  }

  render() {
    return html` <button @click=${this.onClick}><slot></slot></button> `;
  }
}

customElements.define("action-button", ActionButton);
