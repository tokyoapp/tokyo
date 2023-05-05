import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";

export class Slider extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        --transition-curve: ease;
      }
      .photos {
        position: relative;
      }
      .images-container {
        max-width: 100%;
        overflow: visible;
      }
      .images {
        display: flex;
        transform: translateX(calc(var(--view-x, 0) * -1px));
        transition: transform var(--transitionDuration) var(--transition-curve);
      }
      .arrow {
        cursor: pointer;
        position: absolute;
        top: 50%;
        transform: translate(0, -50%);
        opacity: 0.75;
        transition: 0.15s ease-out;
        padding: 10px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        z-index: 1000;
        background: #acacac22;
      }
      .arrow:hover {
        opacity: 1;
        background: #acacac22;
      }
      .arrow.right {
        right: 0;
      }
      .arrow.left {
        left: 0;
      }
      .arrow.left svg {
        transform: rotate(-180deg);
      }
      .arrow:active {
        transition: none;
        transform: translate(0, -50%) scale(0.98);
      }
    `;
  }

  @property({ type: Number, reflect: true })
  public transitionDuration = 0.5;

  @property({ type: String, reflect: true })
  public pointerControls: "none" | "all" = "all";

  public current = 0;

  private _viewPosition = 0;
  private nextStep = 0;
  private swipe = -1;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private viewWidth = this.clientWidth;

  private get slideCount(): number {
    const slides = this.getSlides();
    return slides.length;
  }

  connectedCallback(): void {
    super.connectedCallback();

    window.addEventListener("load", () => {
      this.updateSlides();
    });

    window.addEventListener("resize", () => {
      this.updateSlides();
    });

    this.addEventListener("contextmenu", (e) => e.preventDefault());

    this.addEventListener("touchstart", this._touchstart.bind(this));
    window.addEventListener("touchend", this._touchend.bind(this));
    this.addEventListener("touchcancel", this._touchend.bind(this));
    window.addEventListener("touchmove", this._touchmove.bind(this));

    this.addEventListener("mousedown", (e: MouseEvent) => {
      e.preventDefault();
      this._touchstart(e);
    });
    window.addEventListener("mouseup", this._touchend.bind(this));
    window.addEventListener("mousemove", this._touchmove.bind(this));
  }

  _touchmove(e: TouchEvent | MouseEvent) {
    if (this.swipe == -1) return;

    // @ts-ignore
    const deltaX = (e.touches ? e.touches[0].clientX : e.x) - this.lastPointerX;
    // @ts-ignore
    const deltaY = (e.touches ? e.touches[0].clientY : e.y) - this.lastPointerY;

    if (this.swipe === 0) {
      if (Math.abs(deltaX) > 10) {
        this.swipe = 1;
      } else if (Math.abs(deltaY) > 10) {
        this.swipe = 2;
      }
    }

    if (this.swipe === 1) {
      e.preventDefault();
      e.stopImmediatePropagation();

      if (window.innerWidth < 1500) {
        document.body.style.overflow = "hidden";
      }

      this.moveView(deltaX);

      const move = -deltaX / this.viewWidth;
      if (Math.abs(move) > 0.1) {
        this.nextStep = Math.sign(move);
      }
    }
  }

  _touchstart(e: TouchEvent | MouseEvent) {
    const enabled = this.getAttribute("pointer-controls");
    if (enabled === "none") return;

    this.viewWidth = this.clientWidth;
    this.swipe = 0;
    if (e instanceof TouchEvent) {
      this.lastPointerX = e.touches[0].clientX;
      this.lastPointerY = e.touches[0].clientY;
    } else if (e instanceof MouseEvent) {
      this.lastPointerX = e.x;
      this.lastPointerY = e.y;
    }
    this.setTransitionDuration(0);
  }

  _touchend() {
    this.swipe = -1;
    this.setTransitionDuration(this.transitionDuration);

    this.current += this.nextStep || 0;
    this.nextStep = 0;
    this.updateSlides();
    this.dispatchEvent(new Event("change", { bubbles: true }));

    document.body.style.overflow = "";
  }

  setTransitionDuration(timeInSeconds: number) {
    this.style.setProperty("--transitionDuration", `${timeInSeconds}s`);
  }

  setViewPosition(px: number) {
    this.style.setProperty("--view-x", px.toString());
  }

  moveView(deltaPx: number) {
    this.setViewPosition(this._viewPosition - deltaPx);
  }

  prev() {
    this.current--;
    this.updateSlides();
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  next() {
    this.current++;
    this.updateSlides();
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  toSlide(index: number): void {
    this.current = index;
    this.updateSlides();
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  getSlides() {
    return [...this.children].filter((child) => !child.hasAttribute("slot"));
  }

  updateSlides() {
    const slidesCount = this.slideCount;

    if (slidesCount < 1) return;

    const slides = this.getSlides();

    this.current = Math.min(this.current, slidesCount - 1);
    this.current = Math.max(this.current, 0);

    this._viewPosition = 0;
    for (let i = 0; i < this.current; i++) {
      const child = slides[i];
      this._viewPosition += child.clientWidth;
    }

    // center item
    if (this.hasAttribute("centered")) {
      const xOffset = -this.clientWidth / 2 + slides[this.current].clientWidth / 2;
      this._viewPosition += xOffset;
    }

    for (const child of slides) {
      child.removeAttribute("current");
    }
    slides[this.current].setAttribute("current", "");

    this.setViewPosition(this._viewPosition);

    this.requestUpdate();
  }

  slotChangeCallback() {
    this.updateSlides();
  }

  render() {
    return html`
      <div class="photos">
        <div class="arrows">
          <slot name="arrow-left" ?hidden="${this.current === 0}" @click="${() => this.prev()}">
            <div class="arrow left">
              <svg width="20px" viewBox="0 0 33.163 56.325">
                <path
                  id="Path_1"
                  data-name="Path 1"
                  d="M325.4-457.1l21.092,21.092L325.4-414.92"
                  transform="translate(-318.324 464.174)"
                  fill="none"
                  stroke="black"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="6.5"
                />
              </svg>
            </div>
          </slot>
          <slot
            name="arrow-right"
            ?hidden="${this.current === this.slideCount - 1}"
            @click="${() => this.next()}"
          >
            <div class="arrow right">
              <svg width="20px" viewBox="0 0 33.163 56.325">
                <path
                  id="Path_1"
                  data-name="Path 1"
                  d="M325.4-457.1l21.092,21.092L325.4-414.92"
                  transform="translate(-318.324 464.174)"
                  fill="none"
                  stroke="black"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="6.5"
                />
              </svg>
            </div>
          </slot>
        </div>
        <div class="images-container">
          <div class="images">
            <slot @slotchange="${() => this.slotChangeCallback()}"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sv-slider": Slider;
  }
}

customElements.define("sv-slider", Slider);
