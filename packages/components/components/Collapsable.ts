import { html, css, HTMLTemplateResult, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';

export class Collapsable extends LitElement {
  public static get styles() {
    return [
      css`
        :host {
          display: block;

          --transition-speed: 0.33s;
          --animation-easing: ease;
        }

        .container {
          height: 0;
          width: 100%;
          transition: height calc(var(--transition-speed)) var(--animation-easing);
          position: relative;
          overflow: hidden;
        }

        :host([opened]) slot {
          position: relative;
        }

        slot {
          display: block;
          width: 100%;
          position: absolute;
          overflow: hidden;
        }
      `,
    ];
  }

  @property({ type: Boolean, reflect: true })
  public opened?: boolean;

  @property({ type: Number })
  public scrollOffsetY?: number;

  private currentAnimation = -1;

  public close(): void {
    this.opened = false;
  }

  public open(): void {
    this.opened = true;
  }

  protected updated(): void {
    this.animateHeight();
  }

  protected onAnimationFrame() {
    // scrolls interaction into viewport
    const rect = this.getClientRects()[0];
    if (rect) {
      const elementStartPosY = rect.y;
      const offsetY = this.scrollOffsetY || 0;
      if (elementStartPosY <= offsetY) {
        window.scrollBy(0, (elementStartPosY - offsetY) / 10);
      }
    }
  }

  protected async animateHeight(): Promise<void> {
    return new Promise((resolve, reject) => {
      cancelAnimationFrame(this.currentAnimation);

      const contentHeight = this.slot.offsetHeight;
      const targetHeight = this.opened ? contentHeight : 0;

      const animateFrame = (): void => {
        const currentHeight = this.offsetHeight;
        this.onAnimationFrame();

        if (currentHeight >= targetHeight - 1 && currentHeight <= targetHeight) {
          this.container.style.height = 'auto';
          resolve();
        } else {
          this.currentAnimation = requestAnimationFrame(animateFrame);
        }
      };

      this.container.style.height = targetHeight > 0 ? '0px' : `${contentHeight}px`;
      this.container.style.height = `${this.container.offsetHeight}px`; // offsetHeight call forces relayout early

      requestAnimationFrame(() => {
        this.container.style.height = `${targetHeight}px`;
        animateFrame();
      });
    });
  }

  @query('slot')
  slot;

  @query('.container')
  container;

  protected render(): HTMLTemplateResult {
    return html`
      <div class="container">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sv-collapsable': Collapsable;
  }
}

customElements.define('sv-collapsable', Collapsable);
