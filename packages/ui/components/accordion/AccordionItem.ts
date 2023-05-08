import "mono/components/collapsable";
import { html, css, LitElement } from "lit";
import { property } from "lit/decorators.js";

export class AccordionItem extends LitElement {
  public static get styles() {
    return [
      css`
        :host {
          display: block;

          --accordion-transition-duration-scale: 1;
        }

        .accordion-title {
          cursor: pointer;
        }

        .item-outer-content {
          --accordion-item-height: 0;
          --accordion-content-height: 0;
          --accordion-transition-duration: calc((var(--accordion-content-height)) * 0.001s);

          height: calc(var(--accordion-item-height) * 1px);
          transition: height
            calc(var(--accordion-transition-duration) * var(--accordion-transition-duration-scale))
            ease;
          position: relative;
          overflow: hidden;
        }

        .item-content {
          position: absolute;
        }
      `,
    ];
  }

  @property({ type: Boolean, reflect: true })
  public opened?: boolean;

  @property({ type: String })
  public headline?: string;

  connectedCallback() {
    super.connectedCallback();

    this.tabIndex = 0;
    this.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === " ") {
        this.toggleItem();
      }
    });
  }

  private toggleItem(): void {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
    this.dispatchEvent(new Event("item-opened-change", { bubbles: true }));
  }

  public close() {
    this.opened = false;
  }

  public open() {
    this.opened = true;
  }

  protected render() {
    return html`
      <div class="accordion-title" @click="${this.toggleItem.bind(this)}">
        <slot id="title-element" name="title">
          <div class="headline">
            <span>${this.headline}</span>
          </div>
        </slot>
      </div>

      <sv-collapsable ?opened="${this.opened}">
        <slot></slot>
      </sv-collapsable>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sv-accordion-item": AccordionItem;
  }
}

if (typeof window !== "undefined") {
  window.customElements.define("sv-accordion-item", AccordionItem);
}
