import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       [TAG]: any;
//     }
//   }
// }

export class ProgressCircle extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-block;
        position: relative;

        --transition: stroke-dashoffset 0.33s 0s ease;
      }
      :host([hidden]) {
        display: none;
      }
      svg {
        display: block;
        width: calc(var(--size) * 1px);
        height: calc(var(--size) * 1px);

        --radius: calc((var(--size) / 2) - var(--thickness));
        --circumference: calc(2 * 3.141592653589793 * var(--radius));
      }
      circle {
        r: var(--radius);
        cx: calc(var(--size) / 2);
        cy: calc(var(--size) / 2);
        stroke-width: var(--thickness);
        fill: transparent;
        stroke: currentColor;
        stroke-dasharray: var(--circumference), var(--circumference);
        stroke-dashoffset: calc(var(--circumference) - var(--progress));
        transition: var(--transition);
      }
      .inner {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `;
  }

  @property({ type: Number, reflect: true })
  public size = 30;

  @property({ type: Number, reflect: true })
  public thickness = 2;

  @property({ type: Number, reflect: true })
  public progress = 0;

  get loadProgress() {
    return (this.progress / 100) * (2 * Math.PI * (this.size / 2 - this.thickness));
  }

  render() {
    return html`
      <svg style="--size: ${this.size}; --thickness: ${this.thickness}">
        <circle style="--progress: ${this.loadProgress}" />
      </svg>
      <div class="inner">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'progress-circle': ProgressCircle;
  }
}

customElements.define('progress-circle', ProgressCircle);
