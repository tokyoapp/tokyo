import { html, css, LitElement } from "lit";
import { property } from "lit/decorators.js";

export default class ToolTip extends LitElement {
  static get styles() {
    return css`
      :host {
        position: relative;
        font-size: 14px;
        line-height: 100%;
      }

      :host(:hover) .overlay {
        opacity: 1;
      }

      .overlay {
        position: absolute;
        top: 50%;
        left: calc(100% + 10px);
        transform: translateY(-50%);
        padding: 8px 14px;
        background: white;
        white-space: nowrap;
        border-radius: 6px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.05s ease-out 0.1s;
      }

      .overlay::before {
        content: "";
        position: absolute;
        right: calc(100% - 5px);
        top: 50%;
        transform: translateY(-50%) rotate(45deg);
        width: 10px;
        height: 10px;
        background: white;
        border-bottom-left-radius: 2px;
      }

      span {
        opacity: 0.75;
      }
    `;
  }

  @property({ type: String, reflect: true })
  public label: string;

  protected render() {
    return html`
      <div class="overlay">
        <span>${this.label}</span>
      </div>
      <slot></slot>
    `;
  }
}

customElements.define("tool-tip", ToolTip);
