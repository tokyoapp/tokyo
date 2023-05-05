import { css, html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

@customElement("input-slider")
export class InputSlider extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-block;

        --slider-handle-background: orange;
        --slider-progress-background: orange;
        --slider-progress-backdrop: #eee;
        --slider-outline-color: grey;
      }

      .horizontal-slider {
        margin: 0 0.5rem;
        outline: none;
      }

      .slider {
        position: relative;
        padding: 1rem 0;
        margin: 0 1rem 0 1rem;
        touch-action: none;
      }

      .progress {
        height: 0.5rem;
        position: relative;
        cursor: pointer;
      }
      .progress::before {
        content: "";
        display: block;
        width: calc(100% + 1rem);
        height: 100%;
        background: var(--slider-progress-backdrop);
        opacity: 0.5;
        border-radius: 1rem;
        margin: 0 -0.5rem;
        transition: outline 0.15s ease;
        outline: solid 1px transparent;
        outline-offset: 1px;
      }
      .progress::after {
        content: "";
        display: block;
        width: calc((var(--progress) * 100%) + 1rem);
        pointer-events: none;
        height: 100%;
        background: var(--slider-progress-background);
        border-radius: 1rem;
        margin: 0 -0.5rem;
        position: absolute;
        top: 0;
        z-index: 10;
      }

      .horizontal-slider:focus .progress::before {
        outline-color: var(--slider-outline-color);
      }

      .handle {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background: var(--slider-handle-background);
        position: absolute;
        z-index: 1;
        left: calc(var(--progress) * 100%);
        top: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 1px 2px 1px rgba(0, 0, 0, 0.1);
        cursor: pointer;
      }
      .handle:hover {
        transform: translate(-50%, -50%) scale(1.02);
      }
      .handle:active {
        transform: translate(-50%, -50%) scale(0.985);
        filter: brightness(1.05);
        cursor: grabbing;
      }
    `;
  }

  @property({ type: String, reflect: true })
  public title: string = "";

  @property({ type: String, reflect: true })
  public subtitle: string = "";

  @property({ type: Number, reflect: true })
  public value: number = 0;

  @query("#progressElement")
  private readonly progressElement!: HTMLElement;

  private dragging = false;

  private dragStartPosition: number = 0;

  private lastProgress: number = 0;

  protected onHandleMouseDown(event: MouseEvent): void {
    this.lastProgress = this.value;
    this.dragStartPosition = event.clientX;
    this.dragging = true;
  }

  protected onMouseUp(): void {
    this.dragging = false;
  }

  protected onMouseMove(e: MouseEvent): void {
    if (this.dragging) {
      const deltaPixels = (e.x - this.dragStartPosition) / window.devicePixelRatio;
      const deltaProgress = (deltaPixels / this.progressElement.clientWidth) * devicePixelRatio;

      const progress = Math.min(1, Math.max(this.lastProgress + deltaProgress, 0));

      this.updateProgress(progress);
    }
  }

  protected onProgressClick(e: MouseEvent): void {
    const rect = this.progressElement.getClientRects()[0];
    const progress = (e.x - rect.x) / this.progressElement.clientWidth;
    this.updateProgress(progress);

    this.onHandleMouseDown(e);
  }

  protected updateProgress(progress: number): void {
    this.value = progress;
    this.dispatchEvent(new CustomEvent("input", { detail: { value: progress } }));
  }

  protected onKeyDown(e): void {
    const ev = e as KeyboardEvent;

    switch (ev.key) {
      case "ArrowLeft":
        this.dispatchEvent(new Event("input-jump-back"));
        break;
      case "ArrowRight":
        this.dispatchEvent(new Event("input-jump-forward"));
        break;
    }
  }

  connectedCallback(): void {
    super.connectedCallback();

    window.addEventListener("pointermove", this.onMouseMove.bind(this));
    window.addEventListener("pointerup", this.onMouseUp.bind(this));
    window.addEventListener("pointercancel", this.onMouseUp.bind(this));
    this.addEventListener("keydown", this.onKeyDown.bind(this));
  }

  render() {
    const value = this.value || 0;
    return html`
      <div class="horizontal-slider" tabindex="0">
        <div class="slider" style="--progress: ${value}">
          <div
            id="progressElement"
            class="progress"
            @mousedown="${(e) => this.onProgressClick(e)}"
          ></div>
          <div class="handle" @pointerdown="${(e) => this.onHandleMouseDown(e)}"></div>
        </div>
      </div>
    `;
  }
}
