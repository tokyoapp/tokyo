import { css, html, LitElement } from "lit";
import Actions from "core/actions";

// drop files and dispatch an event with said file's hanldes
// eg a sequence of PNG's, also parse sequence range into single object of mutliple files

export default class FileDropzone extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }
      :host([hover]) {
        border: 4px solid grey;
        box-sizing: border-box;
      }
    `;
  }

  constructor() {
    super();

    this.addEventListener("drop", this.onDrop);
    this.addEventListener("dragend", this.onDragEnd);
    this.addEventListener("dragover", this.onDragOver);
    this.addEventListener("dragenter", this.onDragEnter);
    this.addEventListener("dragleave", this.onDragLeave);
  }

  handleFiles(files) {
    Actions.run("handleFiles", [files]);
  }

  onDrop(e) {
    this.removeAttribute("hover");

    console.log(e.dataTransfer);

    this.handleFiles(e.dataTransfer.files);

    e.preventDefault();
  }

  onDragEnter(e) {
    this.setAttribute("hover", "");
  }

  onDragLeave(e) {
    this.removeAttribute("hover");
  }

  onDragEnd(e) {
    this.removeAttribute("hover");
  }

  onDragOver(e) {
    e.preventDefault();
  }

  render() {
    return html`
      <div>
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("file-dropzone", FileDropzone);

declare global {
  interface HTMLElementTagNameMap {
    "file-dropzone": FileDropzone;
  }
}
