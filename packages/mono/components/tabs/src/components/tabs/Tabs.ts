import { LitElement, html, css } from "lit";
import { customElement, query } from "lit/decorators.js";

@customElement("sv-tabs")
export class Tabs extends LitElement {
  static get styles() {
    return css`
      :host {
        display: contents;
      }

      ::slotted([tab]) {
        display: none;
      }

      ::slotted([tab][selected]) {
        display: block;
      }

      .tab:not([selected]) {
        opacity: 0.5;
      }

      button {
        border: none;
        padding: 8px 12px;
        background: white;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        cursor: pointer;
      }
      button[selected] {
        background: #eee;
      }
      button:hover {
        filter: brightness(0.9);
      }
      button:active {
        transform: scale(0.985);
      }

      .tab-content {
        padding: 10px;
        background: #eee;
      }
    `;
  }

  @query("sv-select")
  selectElement!: HTMLElement;

  private tabs: string[] = [];

  protected updateTabs(): void {
    this.tabs = [];

    const tabElements = this.querySelectorAll("[tab]");
    for (const ele of tabElements) {
      const name = ele.getAttribute("tab");
      if (name) {
        this.tabs.push(name);
      }
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.updateTabs();
  }

  protected updated(): void {
    // @ts-ignore
    if (!this.selectElement?.value) {
      // @ts-ignore
      this.selectElement.activeChildren = ["0"];
      this.onTabChange("0");
    }
  }

  private onTabChange(value: string) {
    let index = 0;
    for (const child of this.children) {
      child.removeAttribute("selected");

      if (+value == index) {
        child.setAttribute("selected", "");
      }

      index++;
    }
  }

  render() {
    return html`
      <sv-select @change="${(e: Event) => this.onTabChange((e.target as HTMLInputElement).value)}">
        ${this.tabs.map((str) => html` <button class="tab">${str}</button> `)}
      </sv-select>

      <div class="tab-content">
        <slot @slotchange="${() => this.updateTabs()}"></slot>
      </div>
    `;
  }
}
