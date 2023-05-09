import { LokalFilesystem } from "filesystem";
import { html, css, LitElement } from "lit";
import { openDir } from "../client.js";

export class LastOpened extends LitElement {
  static get styles() {
    return css`
      .placeholder {
        width: 100%;
        height: 100%;
        padding: 15px;
        text-align: center;
        display: block;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        flex-direction: column;
        align-items: center;
        opacity: 0.5;
      }

      .placeholder .text {
        font-weight: 400;
        margin-top: 10px;
      }

      .placeholder gyro-icon {
        --icon-size: 24px;
      }

      .recent-list {
        display: grid;
        grid-template-columns: auto auto auto;
      }

      .file-entry {
        border: 1px solid grey;
        margin: 10px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 5px;
        padding: 10px;
        border-radius: 4px;
        cursor: pointer;
      }

      .file-entry:hover {
        background: #333;
      }
    `;
  }

  list = [];

  async connectedCallback(): void {
    super.connectedCallback();
    const list = await LokalFilesystem.getFileList();
    this.list = list;
    this.requestUpdate();
  }

  open(handle: FileSystemHandle) {
    openDir(handle);
  }

  render() {
    return html`
      <div class="placeholder">
        <span class="text">Recent locations:</span>
        <br />
        <div class="recent-list">
          ${this.list.map((file) => {
            return html`
              <div class="file-entry" @click=${() => this.open(file)}>
                <gyro-icon icon="File"></gyro-icon>
                <div>${file.id}</div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}

customElements.define("last-opened", LastOpened);
