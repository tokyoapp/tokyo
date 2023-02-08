import { css, html, LitElement, PropertyValueMap } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("aui-lazymedia")
export class LazyMedia extends LitElement {
  static get styles() {
    return css`
      :host {
        display: contents;
      }

      video,
      img {
        display: block;
        object-fit: cover;
        transition: opacity 0.5s ease;
        opacity: 1;
        width: 100%;
        height: 100%;
      }

      video.hidden,
      img.hidden {
        opacity: 0;
      }
    `;
  }

  @property({ type: String, reflect: true })
  public src?: string;

  @property({ type: String, reflect: true })
  public alt?: string;

  @property({ type: String, reflect: true })
  public width?: string;

  @property({ type: Boolean, reflect: true })
  public autoplay?: boolean;

  @property({ type: Boolean, reflect: true })
  public loop?: boolean;

  @property({ type: Boolean, reflect: true })
  public controls?: boolean;

  @property({ type: String, reflect: true })
  public height?: string;

  @property({ type: Boolean, reflect: true })
  public playing?: boolean;

  private media: HTMLImageElement | HTMLVideoElement | null = null;

  private type?: string[];

  protected async updated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): Promise<void> {
    if (_changedProperties.has("playing") && this.type && this.type[0] === "video") {
      if (this.playing) {
        this.media?.play();
      } else {
        this.media?.pause();
      }
    }
    if (_changedProperties.has("src")) {
      const req = await fetch(this.src, { method: "HEAD" });
      const headers = new Map(req.headers);
      const type = headers.get("content-type")?.split("/");
      this.type = type;

      let media;

      if (type) {
        switch (type[0]) {
          case "image":
            media = new Image();

            media.addEventListener("load", () => {
              setTimeout(() => media.classList.remove("hidden"), 10);
            });
            break;
          case "video":
            media = document.createElement("video");
            media.controls = this.controls;
            media.loop = this.loop;

            if (this.autoplay) {
              media.autoplay = true;
              media.muted = true;
              media.playsinline = true;
            }

            media.addEventListener("canplay", () => {
              setTimeout(() => media.classList.remove("hidden"), 10);
            });
            break;
        }
      } else {
        console.warn("No HEAD request supported on media request.");

        media = new Image();

        media.addEventListener("load", () => {
          setTimeout(() => media.classList.remove("hidden"), 10);
        });
      }

      media.src = this.src;
      media.loading = "lazy";
      media.alt = this.alt || "";
      media.classList.add("hidden");

      this.media = media;
      this.requestUpdate();
    }
  }

  render() {
    return html`${this.media}`;
  }
}
