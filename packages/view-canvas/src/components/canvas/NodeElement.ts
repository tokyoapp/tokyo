import { html, LitElement } from "lit";
import CanvasElement from "./CanvasElement";

export class NodeElement extends LitElement {
  canvas: CanvasElement;

  constructor(canvas) {
    super();

    this.canvas = canvas;
  }

  onDraw() {}

  render() {
    return html`
      <style>
        :host {
          transform-origin: 0 0;
          transform: scale(${this.canvas.currentScale});
          position: absolute;
          top: calc(var(--y) * 1px);
          left: calc(var(--x) * 1px);
          width: calc(var(--w) * 1px / var(--s));
          height: calc(var(--h) * 1px / var(--s));
          pointer-events: none;
          background: rgb(33 33 33 / 0.75);
          box-shadow: 1px 3px 8px rgb(0 0 0 / 25%);
          border: 1px solid #252525;
          user-select: none;
          color: #eee;
          overflow: hidden;
          word-break: break-all;
        }
      </style>
      <div class="container">
        <slot></slot>
      </div>
    `;
  }
}
