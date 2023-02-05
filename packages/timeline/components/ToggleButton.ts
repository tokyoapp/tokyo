import { html, css, LitElement, PropertyValueMap } from "lit";
import { property } from "lit/decorators.js";

export default class ToggleButton extends LitElement {
  @property({ type: String })
  public value: string;

  @property({ type: Boolean })
  public checked: boolean;

  constructor() {
    super();

    this.addEventListener("click", (e) => {
      this.checked = !this.checked;

      this.dispatchEvent(new CustomEvent("change", { value: this.checked }));
    });
  }

  protected updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    if (this.checked) {
      this.children[0].setAttribute("hidden", "");
      this.children[1].removeAttribute("hidden");
    } else {
      this.children[1].setAttribute("hidden", "");
      this.children[0].removeAttribute("hidden");
    }
  }

  static get styles() {
    return css`
      :host {
        width: 18px;
        height: 18px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
      }
    `;
  }

  render() {
    return html`
      <span class="value">
        <slot></slot>
      </span>
    `;
  }
}

customElements.define("toggle-button", ToggleButton);
