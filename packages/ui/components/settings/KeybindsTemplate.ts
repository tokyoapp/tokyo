import { html, css, LitElement } from "lit-element";
import { Action } from "atrium/lib/Actions";
import "../Input";

class SettingsKeybindsComponent extends LitElement {
  static get styles() {
    return css`
      .keybinds {
        margin-top: 20px;
        font-family: "Roboto";
      }
      .row {
        border-radius: 4px;
        background: #444;
        display: grid;
        grid-template-columns: 1fr 150px;
        align-items: center;
        margin-bottom: 2px;
        overflow: hidden;
      }
      .row.header {
        background: none;
        opacity: 0.75;
      }
      .row .cell {
        line-height: 35px;
        padding: 0 15px;
        white-space: nowrap;
        font-size: 14px;
      }
      .cell.title {
      }
      .cell.shortcut {
        border-left: 1px solid #333;
        text-align: center;
        cursor: pointer;
        user-select: none;
        outline: none;
        font-weight: 400;
        font-family: "Consolas";
      }
      .cell.shortcut:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      .cell.shortcut[active],
      .cell.shortcut:active {
        background: rgba(255, 255, 255, 0.02);
      }

      .search {
        width: 200px;
      }
    `;
  }

  filter = "";

  constructor() {
    super();
  }

  getKeybindList() {
    const binds = Action.getMap();
    const keybinds = [];

    for (let bind in binds) {
      const action = Action.get(bind);
      const shortcut = binds[bind];

      keybinds.push({
        title: action.description,
        action,
        shortcut,
        bind,
      });
    }

    return keybinds;
  }

  rebind(e, keybind) {
    const targetEle = e.target;

    targetEle.tabIndex = 0;
    targetEle.focus();
    targetEle.innerText = "Press a key";
    targetEle.setAttribute("active", "");

    let shift = false;
    let ctrl = false;
    let alt = false;

    const changeBind = (newShortcut) => {
      Action.mapShortcut(keybind.bind, newShortcut);

      targetEle.removeAttribute("active");
      targetEle.innerText = Action.getMap()[keybind.bind];
    };

    Action.captureInput().then(changeBind);
  }

  setFilter(filterString) {
    this.filter = filterString;
    this.update();
  }

  render() {
    const keybinds = this.getKeybindList();
    const filter = this.filter || "";

    return html`
      <gyro-input
        placeholder="Search Keybind"
        class="search"
        @input="${(e) => {
          this.setFilter(e.target.value);
        }}"
      >
      </gyro-input>

      <div class="keybinds">
        <div class="row header">
          <div class="cell">Description</div>
          <div class="cell">Shortcut</div>
        </div>
        ${keybinds.map((keybind) => {
          if (keybind.title.toLocaleLowerCase().match(filter.toLocaleLowerCase())) {
            return html`
              <div class="row keybind">
                <div class="cell title">${keybind.title}</div>
                <div class="cell shortcut" @click=${(e) => this.rebind(e, keybind)}>
                  ${keybind.shortcut}
                </div>
              </div>
            `;
          }
        })}
      </div>
    `;
  }
}

customElements.define("gyro-keybinds", SettingsKeybindsComponent);

export default () => {
  return html` <gyro-keybinds></gyro-keybinds> `;
};
