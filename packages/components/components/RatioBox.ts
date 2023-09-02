import { css, html, LitElement } from 'lit';

export default class RatioBox extends LitElement {
  static get styles() {
    return css`
      :host {
        --padding: 32px;
        --ratio: 16 / 9;

        aspect-ratio: var(--ratio);
        height: calc(100% - var(--padding));
        max-width: calc(100% - var(--padding));
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .content {
        aspect-ratio: var(--ratio);
        width: 100%;
        position: relative;
      }
    `;
  }

  render() {
    return html`
      <div class="content">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('ratio-box', RatioBox);

declare global {
  interface HTMLElementTagNameMap {
    'ratio-box': RatioBox;
  }
}
