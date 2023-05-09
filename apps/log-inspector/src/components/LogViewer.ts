import { html, css, LitElement } from "lit";

export class LogViewer extends LitElement {
  chunks = [];
  scrollLock = false;

  itter = null;

  loading = false;

  connectedCallback(): void {
    window.addEventListener("file", async ({ detail }) => {
      const fileItter = detail.itter;
      this.itter = fileItter;
      this.chunks = [];
      await this.loadNextChunk();
      this.scrollToLatest();
    });

    super.connectedCallback();
    this.requestUpdate();
  }

  protected async loadNextChunk() {
    if (!this.itter) throw new Error("no file exists");
    this.loading = true;
    this.requestUpdate();

    try {
      const c = await this.itter.next();
      if (!c.done) {
        console.log(c);
        c.value.split("\n").forEach((line) => this.chunks.push(line));
      }
    } catch (err) {
      console.error(err);
    }

    this.loading = false;
    this.requestUpdate();

    return this.updateComplete;
  }

  protected scrollToLatest() {
    const log = this.shadowRoot?.querySelector(".log");
    if (log) {
      this.height = (log.clientHeight - 15) / 15;
    }

    this.scrollPos[1] = Math.min(Math.max(0, this.chunks.length), this.chunks.length - this.height);
    this.requestUpdate();
  }

  scrollPos = [0, 0];
  height = 10;

  firstUpdate = true;

  protected updated(): void {
    const log = this.shadowRoot?.querySelector(".log");

    if (this.firstUpdate) {
      this.firstUpdate = false;

      window.addEventListener("resize", () => {
        const log = this.shadowRoot?.querySelector(".log");
        if (log) {
          this.height = (log.clientHeight - 15) / 15;
        }
        this.requestUpdate();
      });
      if (log) {
        log.addEventListener("wheel", (e) => {
          this.scrollPos[1] = Math.min(
            Math.max(0, this.scrollPos[1] + e.deltaY * 0.125),
            this.chunks.length - this.height
          );

          const maxPos = log.scrollHeight - log.clientHeight;
          this.scrollLock = log.scrollTop > maxPos - 10;

          if (this.scrollPos[1] + this.height >= this.chunks.length) {
            this.loadNextChunk();
          }

          this.requestUpdate();
        });
      }
    }
  }

  static get styles() {
    return css`
      .log {
        height: 100%;
        overflow: none;
        user-select: text;
        padding: 10px;
        box-sizing: border-box;
      }
      pre {
        margin: 0;
      }
    `;
  }

  render() {
    const offset = this.scrollPos[1];
    return html`
      <div class="log">
        <div>${this.loading ? html`<div>Loading...</div>` : "- - -"}</div>
        ${this.chunks.slice(offset, offset + this.height).map((line) => {
          return html`<pre>${line}</pre>`;
        })}
      </div>
    `;
  }
}

customElements.define("log-viewer", LogViewer);
