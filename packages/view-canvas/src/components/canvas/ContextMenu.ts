import { html, LitElement } from "lit";

export class ContextMenu extends LitElement {
  constructor(optns) {
    super();
    this.items = optns.items;

    this.tabIndex = 0;

    this.addEventListener("blur", (e) => {
      this.hide();
    });
  }

  hide() {
    this.style.display = "none";
  }

  setPosition(x, y) {
    this.style.display = "block";
    this.focus();
    this.style.setProperty("--x", x);
    this.style.setProperty("--y", y);
  }

  render() {
    return html`
      <style>
        :host {
          z-index: 100000;
          display: none;
          position: absolute;
          top: calc(var(--y, 50%) * 1px);
          left: calc(var(--x, 50%) * 1px);
          border: 1px solid hsl(0deg 0% 18% / 33%);
          background: rgb(39 39 39 / 33%);
          padding: 6px 0;
          border-radius: 8px;
          outline: none;
          box-shadow: 1px 3px 8px rgb(0 0 0 / 25%);
          backdrop-filter: blur(8px);
        }
        .menu {
        }
        .menu-item {
          min-width: 180px;
          padding: 7px 12px;
          font-size: 12px;
          font-family: "Roboto", sans-serif;
          color: #eee;
          cursor: pointer;
          border-radius: 0;
          border-radius: 6px;
          margin: 0 4px;
        }
        .menu-item:not(:last-child) {
          margin-bottom: 4px;
        }
        .menu-item:hover {
          background: rgba(127, 127, 127, 0.5);
        }
        .menu-item:active {
          background: rgba(127, 127, 127, 0.25);
        }
        @keyframes open-outer {
        }
        @keyframes open-inner {
        }
      </style>
      <div class="menu-container">
        <div class="menu">
          ${this.items.map((item) => {
            return html`
              <div
                class="menu-item"
                @click="${(e) => {
                  if (item.action) item.action();
                  this.hide();
                }}"
              >
                ${item.title}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}

customElements.define("context-menu", ContextMenu);
