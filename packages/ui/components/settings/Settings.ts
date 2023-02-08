import { html, css, LitElement } from "lit-element";
import componentStyle from "./component.style";
import KeybindsTemplate from "./KeybindsTemplate";
import { Action } from "atrium/lib/Actions";
import "../Switch";
import Env from "atrium/lib/Enviroment";

let settings = null;

Action.register({
  name: "settings.open",
  description: "Open Settings",
  shortcut: "Escape",
  onAction() {
    if (!settings || settings.clientWidth == 0) {
      settings = new SettingsComponent();
      document.body.appendChild(settings);
    } else if (settings) {
      settings.close();
    }
    return true;
  },
});

const settingsTabs = [
  {
    title: "Keybindings",
    icon: "Keyboard",
    content: KeybindsTemplate,
  },
];

export class SettingsComponent extends LitElement {
  static get styles() {
    return css`
      ${componentStyle}
      :host {
        display: block;
        position: fixed;
        top: 0px;
        left: 60px;
        width: auto;
        height: 100%;
        z-index: 10000;
      }

      @keyframes zoom-in {
        from {
          transform: translateX(-100px) scale(0.99);
          opacity: 0;
        }
        to {
          transform: scale(1);
        }
      }

      @keyframes zoom-out {
        from {
          transform: scale(1);
          opacity: 1;
        }
        to {
          transform: translateX(-100px) scale(0.99);
          opacity: 0;
        }
      }

      .settings {
        display: flex;
        flex-direction: row;
        width: 900px;
        max-width: 100%;
        height: 100%;
        background: var(--background-level-1);
        border-radius: 6px;
        box-shadow: 2px 4px 20px rgba(0, 0, 0, 0.2);
        animation: zoom-in 0.05s ease;
        position: relative;
        overflow: hidden;
      }

      .close-button {
        z-index: 100;
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;
        background: transparent;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        --icon-size: 14px;
        position: absolute;
        right: 30px;
        top: 30px;
        outline: none;
        opacity: 0.5;
      }

      .close-button:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
      }

      .close-button:active {
        background: rgba(255, 255, 255, 0.05);
      }

      .sidebar {
        width: 250px;
        height: 100%;
        background-image: url(./images/settings-bg.svg);
        background-size: cover;
        padding: 30px 25px 30px 35px;
        box-sizing: border-box;
        height: 100%;
        box-shadow: 1px 0px 12px rgba(0, 0, 0, 0.15);
        z-index: 100;
        user-select: none;
        display: grid;
        grid-template-rows: auto 1fr auto;
      }

      .sidebar .title {
        font-size: 32px;
        font-family: "Roboto", sans-serif;
        font-weight: 300;
      }

      .sidebar .tabs {
        margin-top: 30px;
      }

      .sidebar .tab-icon {
        margin-right: 12px;
        --icon-size: 16px;
      }

      .sidebar .tab {
        padding: 6px 10px;
        display: flex;
        align-items: center;
        margin: 0 0 2px -10px;
        font-size: 15px;
        font-family: "Roboto", sans-serif;
        font-weight: 300;
        border-radius: 4px;
        cursor: pointer;
        user-select: none;
      }

      .sidebar .tab:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .sidebar .tab:active {
        background: var(--accent-color);
      }

      .sidebar .tab[active] {
        background: var(--accent-color);
      }

      .content {
        flex: 1;
        position: relative;
        background: var(--background-color);
        padding: 30px;
        box-sizing: border-box;
      }

      /* Credits */
      .credits {
        font-family: "Open Sans", sans-serif;
        font-size: 14px;
        opacity: 0.5;
      }
      h3 {
        margin: 0 0 20px 0;
        font-size: 22px;
        font-weight: 400;
      }
      .version {
        opacity: 0.5;
      }
    `;
  }

  static createTab(options) {
    for (let tab of settingsTabs) {
      if (tab.title == options.title) {
        settingsTabs.splice(settingsTabs.indexOf(tab), 1);
        break;
      }
    }

    const tabIndex = settingsTabs.unshift(options);

    return tabIndex;
  }

  static removeTab(tabIndex) {
    return settingsTabs.splice(tabIndex, 1);
  }

  constructor() {
    super();

    this.activeTab = settingsTabs[0];
    this.update();

    this.tabIndex = 0;
  }

  close() {
    const settings = this.shadowRoot.querySelector(".settings");
    settings.onanimationend = () => {
      this.remove();
      settings.onanimationend = null;
    };
    settings.style.animation = `zoom-out .05s ease`;
  }

  openTab(tab) {
    this.activeTab = tab;
    this.update();
  }

  render() {
    if (!settingsTabs) return html``;

    const contentEle = document.createElement("div");
    contentEle.className = "content";

    let content = null;
    if (this.activeTab) {
      content = this.activeTab.content();

      let strings = [content];
      let args = [];

      if (content.type == "html") {
        strings = content.strings.raw;
        args = content.values;
      }

      content = html(strings, ...args);
    }

    return html`
      <div class="settings">
        <button class="close-button" @click=${(e) => this.close()}>
          <gyro-icon icon="Close"></gyro-icon>
        </button>
        <div class="sidebar">
          <div class="title">Settings</div>
          <div class="tabs">
            ${settingsTabs.map((tab, i) => {
              return html`
                <div
                  class="tab"
                  @click=${(e) => this.openTab(tab)}
                  ?active=${this.activeTab == tab}
                >
                  <gyro-icon class="tab-icon" icon="${tab.icon}"></gyro-icon>
                  <span>${tab.title}</span>
                </div>
              `;
            })}
          </div>
          <div class="credits">
            <div>
              <h3>${document.title} <span class="version">${Env.version}</span></h3>
            </div>
            <div>Created by <a target="_blank" href="https://twitter.com/timh4v">luckydye</a></div>
          </div>
        </div>
        <div class="content">${content}</div>
      </div>
    `;
  }
}

customElements.define("gyro-settings", SettingsComponent);
