import { html, LitElement } from 'lit';

export class OverlayElement extends LitElement {
  render() {
    return html`
      <style>
        :host {
          position: absolute;
          top: calc(var(--y) * 1px + var(--h) * 1px);
          left: calc(var(--x) * 1px);
          margin-top: 10px;
          pointer-events: all;
          padding: 8px;
          border-radius: 4px;
          background: rgb(33 33 33 / 0.75);
          box-shadow: 1px 3px 8px rgb(0 0 0 / 25%);
          border: 1px solid #252525;
          backdrop-filter: blur(4px);
          user-select: none;
          z-index: 100000;
          transform-origin: 10px -40px;
        }
        .container-corner {
          position: absolute;
          bottom: 100%;
          left: 10px;
          display: block;
          fill: #252525;
        }
        .container {
          display: flex;
        }
        .container > *:not(:last-child) {
          margin-right: 10px;
        }
        svg {
          display: block;
        }
        :host {
          opacity: 1;
          animation: show 0.075s ease-out;
          transition: opacity 0.075s ease-out, transform 0.1s ease-out,
            clip-path 0.1s ease-out;
        }
        @keyframes show {
          from {
            clip-path: polygon(0 0, 0 0, 0 100%, 0% 100%);
          }
          to {
            clip-path: polygon(0 -20px, 100% 0, 100% 100%, 0% 100%);
          }
        }
        @keyframes hide {
          from {
            clip-path: polygon(0 -20px, 100% 0, 100% 100%, 0% 100%);
          }
          to {
            clip-path: polygon(0 0, 0 0, 0 100%, 0% 100%);
          }
        }
        :host([invisible]) {
          animation: hide 0.075s ease-out;
          opacity: 0;
          transform: scale(0.95);
          pointer-events: none;
        }
      </style>
      <div class="container-corner">
        <svg
          width="15.3px"
          height="8.1px"
          viewBox="0 0 15.3 8.1"
          xml:space="preserve"
        >
          <path
            class="st0"
            d="M15.3,7.5L8.6,0.4c-0.5-0.6-1.4-0.6-1.9,0L0,7.5H15.3z"
          />
        </svg>
      </div>
      <div class="container">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('canvas-overlay-element', OverlayElement);
