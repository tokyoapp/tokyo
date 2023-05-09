import { html, css, LitElement } from "lit";

export class LogViewer extends LitElement {
  chunks = [];
  scrollLock = false;

  itter = null;

  connectedCallback(): void {
    window.addEventListener("file", async ({ detail }) => {
      const fileItter = detail.itter;
      this.itter = fileItter;
      this.loadNextChunk();
    });

    super.connectedCallback();
    this.requestUpdate();
  }

  firstUpdate = true;

  protected async loadNextChunk() {
    if (!this.itter) throw new Error("no file exists");

    const c = await this.itter.next();
    if (!c.done) {
      console.log(c);
      this.chunks.push(c.value);
      this.requestUpdate();
    }
  }

  protected updated(): void {
    const log = this.shadowRoot?.querySelector(".log");

    if (this.firstUpdate) {
      if (log) {
        log.addEventListener("scroll", (e) => {
          const maxPos = log.scrollHeight - log.clientHeight;
          this.scrollLock = log.scrollTop > maxPos - 10;

          if (log.scrollTop < 100) {
            this.loadNextChunk();
          }
        });
      }
    }

    if (log) {
      log.scrollTo({ top: log.scrollHeight });
    }

    this.firstUpdate = false;
  }

  static get styles() {
    return css`
      .log {
        height: 100%;
        overflow: auto;
        user-select: text;
      }
    `;
  }

  render() {
    return html`
      <div class="log">
        <pre>${this.chunks}</pre>
      </div>
    `;
  }
}

customElements.define("log-viewer", LogViewer);
