import { css, CSSResultGroup, html, LitElement } from 'lit';

export class FileDropEvent extends Event {
  file: File;

  constructor(file: File) {
    super('drop-file-event');

    this.file = file;
  }
}

export default class FileDrop extends LitElement {
  constructor() {
    super();

    this.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    this.addEventListener('drop', (e) => {
      const files = e.dataTransfer?.files;

      if (files) {
        for (let file of files) {
          if (file.type.match('video')) {
            this.dispatchEvent(new FileDropEvent(file));
          }
        }
      }

      e.preventDefault();
    });
  }

  static get styles(): CSSResultGroup | undefined {
    return css`
      :host {
      }

      .dropzone {
        width: 500px;
        height: 200px;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
        border: 1px solid currentColor;
        border-radius: 6px;
        opacity: 0.5;
      }
    `;
  }

  render() {
    return html`
      <div class="dropzone">
        <p>Drop Video or Audio here</p>
      </div>
    `;
  }
}

customElements.define('file-drop', FileDrop);
