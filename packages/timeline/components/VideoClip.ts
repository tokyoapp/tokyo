import { html, css, LitElement } from "lit";

export class ClipElement extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        height: 100%;
        width: calc(var(--length) * var(--zoom) * var(--pixel-ratio) * 10px);
        position: absolute;
        top: 0;
        left: calc(
          (var(--begins) + var(--scroll)) * var(--zoom) * var(--pixel-ratio) *
            10px
        );
        border-radius: 4px;
        overflow: hidden;
      }

      :host::before {
        content: attr(title);
        position: absolute;
        top: 0;
        left: 0;
        padding: 2px 4px;
        box-sizing: border-box;
        width: 100%;
        background: rgba(0, 0, 0, 0.15);
        font-size: 10px;
        z-index: 100;
        pointer-events: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host(:active) .clip,
      :host([selected]) .clip {
        filter: brightness(1.1);
      }

      .clip {
        height: 100%;
        width: 100%;
        background: hsla(150, 65%, 42%, 1);
        display: inline-block;
        box-sizing: border-box;
        border: 1px solid rgba(255, 255, 255, 0.25);
        position: relative;
      }

      .handle {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 10px;
        cursor: col-resize;
      }
      .handle:active {
        background: rgba(0, 0, 0, 0.12);
      }
      .left-handle {
        left: 0;
      }
      .right-handle {
        right: 0;
      }
    `;
  }

  render() {
    return html`
      <div class="clip">
        <div class="left-handle handle"></div>
        <div class="right-handle handle"></div>
      </div>
    `;
  }

  get length() {
    return this.endTime - this.startTime;
  }

  get startTime() {
    return this.clip.startTime;
  }

  set startTime(time) {
    this.clip.startTime = time;
  }

  get endTime() {
    return this.clip.endTime;
  }

  set endTime(time) {
    this.clip.endTime = time;
  }

  constructor() {
    super();

    this.addEventListener("click", () => {
      this.dispatchEvent(new Event("select"));
      this.setAttribute("selected", "");
    });
    this.addEventListener("deselect", () => {
      this.removeAttribute("selected");
    });

    this.addEventListener("mousedown", (e) => {
      this.mouseDownHandler(e);
    });

    window.addEventListener("mousemove", (e) => {
      this.mouseMoveHandler(e);
    });

    window.addEventListener("mouseup", (e) => {
      this.mouseUpHandler(e);
    });

    this.setStartAndEndPoint(
      +this.getAttribute("start"),
      +this.getAttribute("end")
    );
  }

  setStartAndEndPoint(start, end) {
    start = start != null ? start : this.startTime;
    end = end != null ? end : this.endTime;

    if (start < 0) return false;
    if (end - start < 0.2) return false;
    if (end < start + 0.1) return false;
    if (start > end - 0.1) return false;

    const prev = this.previousElementSibling;
    const next = this.nextElementSibling;

    let preventEnd = false;
    let preventStart = false;

    if (next && next.startTime < end) {
      preventEnd = !next.setStartAndEndPoint(end, next.endTime);
    }

    if (prev && prev.endTime > start) {
      preventStart = !prev.setStartAndEndPoint(prev.startTime, start);
    }

    if (!preventStart && !preventEnd) {
      // if(this.node && this.node.video) {
      //     this.node.startOffset = - start;
      //     this.node.endOffset = end - start;

      //     const videoDuration = this.node.video.duration || 5;

      //     end = Math.min(start + videoDuration, end);
      // }

      this.endTime = end;
      this.startTime = start;
    }

    this.style.setProperty("--length", this.length);
    this.style.setProperty("--begins", this.startTime);

    this.parentNode.dispatchEvent(new Event("clipchange"));

    return true;
  }

  mouseDownHandler(e) {
    this.moving = true;
    this.mouseTarget = e.path[0];
    this.mouseDown = e;
    this.prevStartTime = this.startTime;
    this.prevEndTime = this.endTime;
  }

  mouseMoveHandler(e) {
    const pixelRatio = this.parentNode ? this.parentNode.pixelRatio : 0;

    if (this.moving && pixelRatio) {
      const deltaX = Math.floor(e.x - this.mouseDown.x) / pixelRatio / 10;

      if (this.mouseTarget.classList.contains("left-handle")) {
        this.setStartAndEndPoint(
          Math.max(0, this.prevStartTime + deltaX),
          this.prevEndTime
        );
      } else if (this.mouseTarget.classList.contains("right-handle")) {
        this.setStartAndEndPoint(this.prevStartTime, this.prevEndTime + deltaX);
      } else {
        const startTime = Math.max(this.prevStartTime + deltaX, 0);
        const endTime = this.prevEndTime - (this.prevStartTime - startTime);

        this.setStartAndEndPoint(startTime, endTime);
      }
    }
  }

  mouseUpHandler(e) {
    this.moving = false;
  }
}
