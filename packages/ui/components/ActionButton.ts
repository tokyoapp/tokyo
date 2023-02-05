import { property } from "lit/decorators.js";
import Actions from "core/actions";
import Button from "./Button";

export default class ActionButton extends Button {
  @property()
  public action?: string;

  onClick() {
    this.action && Actions.run(this.action);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("click", this.onClick);
  }

  disconnectedCallback(): void {
    this.removeEventListener("click", this.onClick);
  }
}

customElements.define("action-button", ActionButton);

declare global {
  interface HTMLElementTagNameMap {
    "action-button": ActionButton;
  }
}
