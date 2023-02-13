import { html, css, LitElement } from "lit-element";
import componentStyles from "../Components.style";
import styles from "./Outliner.style";

class OpenFileEvent extends Event {
  constructor(file) {
    super("openfile");
    this.file = file;
  }
}

class AddFileEvent extends Event {
  constructor(file) {
    super("addfile");
    this.file = file;
  }
}

const typeIconMap = {
  geometry: "Object",
  scene: "Scale",
};

/*
    Item Object:

    {
        name: <display name>,
        type: <item type (root, file, model, ... [typeIconMap])>,
        tools: [
            {
                name: <tool display name>,
                icon: <icon of the tool button>
                action: function
            }
            ...
        ],
        uncollapsed: <bool open or closed item>,
        children: <child items>,
    }

*/

export default class Outliner extends LitElement {
  constructor() {
    super();

    this.selection = new Set();
    this.lastItemIndex = null;
    this.readonly = false;
    this.rootNode = null;
  }

  setRoot(tree) {
    this.scene = tree;
    this.updateScene();
  }

  updateScene() {
    if (this.scene) {
      this.tree = this.scene.getSceneGraph();
    } else {
      this.tree = null;
    }
    this.update();
  }

  getItemByIndex(itemIndex) {
    let index = -1;
    let foundItem = null;

    const currate = (arr) => {
      for (let item of arr) {
        index++;

        if (index === itemIndex) {
          foundItem = item;
        }

        if (item.children) {
          currate(item.children);
        }
      }
    };

    currate([this.rootNode]);

    return foundItem;
  }

  moveObject(itemIndex, selection, order) {
    let parentObject = this.getItemByIndex(itemIndex);

    if (order === 0) {
      selection = selection.map((index) => this.getItemByIndex(index));

      for (let selectionItem of selection) {
        if (selectionItem.object !== parentObject.object) {
          selectionItem.object.parent = parentObject.object;
        }
      }
    } else {
      selection = selection.map((index) => this.getItemByIndex(index));

      for (let selectionItem of selection) {
        if (parentObject.object.parent && selectionItem.object !== parentObject.object.parent) {
          selectionItem.object.parent = parentObject.object.parent;
        } else {
          selectionItem.object.parent = null;
        }
      }
    }

    this.updateScene();
  }

  filterItem(item) {
    return true;
  }

  render() {
    if (!this.tree) {
      return html`
        <style>
          ${componentStyles}
          ${styles}
        </style>
        <a class="title placeholder">No root selected.</a>
      `;
    }

    let index = 0;

    let tree = {
      name: "Scene",
      type: "scene",
      tools: [],
      uncollapsed: true,
      children: this.tree,
    };

    this.rootNode = tree;

    const objectArray = [];

    const renderTree = (group) => {
      return group.map((item) => renderItem(item));
    };

    const renderItem = (item) => {
      if (item.type !== "scene") {
        item.tools = [
          {
            name: "Show / Hide",
            icon: "Eye_visible",
            action: (item, tool, e) => {
              const object = item.object;

              const iconEle = e.target.querySelector("gyro-icon") || e.target;

              if (object.hidden) {
                object.hidden = false;
                tool.icon = "Eye_visible";
                iconEle.icon = tool.icon;
              } else {
                object.hidden = true;
                tool.icon = "Eye_hidden";
                iconEle.icon = tool.icon;
              }
            },
          },
        ];
      }

      if (!item.type) {
        item.type = "geometry";
      }

      if (item.type !== "folder" && item.type !== "root" && !this.filterItem(item)) {
        return;
      }

      const itemIndex = index++;
      objectArray[itemIndex] = item.object;

      const toggleCollapse = (e) => {
        const itemEle = e.target.parentNode.parentNode;
        if (itemEle.hasAttribute("collapsed")) {
          itemEle.removeAttribute("collapsed");
          item.uncollapsed = true;
        } else {
          itemEle.setAttribute("collapsed", "");
          item.uncollapsed = false;
        }
      };

      const selectItem = (e) => {
        if (!e.ctrlKey && !e.shiftKey) {
          this.selection.clear();
        }
        if (e.shiftKey) {
          if (this.lastItemIndex != null) {
            const delta = itemIndex - this.lastItemIndex;

            for (let i = 0; i <= Math.abs(delta); i++) {
              this.selection.add(this.lastItemIndex + i * Math.sign(delta));
            }
          } else {
            this.selection.add(itemIndex);
          }
        } else {
          this.selection.add(itemIndex);
        }

        this.lastItemIndex = itemIndex;
        this.update();
      };

      const dragOverHandler = (e) => {
        if (this.readonly) return;

        e.preventDefault();
        e.target.setAttribute("target", "");
        e.dataTransfer.dropEffect = "move";

        const bounds = e.target.getBoundingClientRect();
        const height = bounds.height;
        const y = e.y - bounds.y;

        if (y < height * (1 / 5)) {
          e.target.setAttribute("top", "");
        } else if (y > height * (4 / 5)) {
          e.target.setAttribute("bottom", "");
        } else {
          e.target.removeAttribute("top");
          e.target.removeAttribute("bottom");
        }
      };

      const dragEndHandler = (e) => {
        if (this.readonly) return;

        dragLeaveHandler(e);
        this.removeAttribute("data-drag");
      };

      const dragLeaveHandler = (e) => {
        if (this.readonly) return;

        e.target.removeAttribute("target");
        e.target.removeAttribute("top");
        e.target.removeAttribute("bottom");
      };

      const dragStartHandler = (e) => {
        if (this.readonly) return;

        e.dataTransfer.setData("item", [...this.selection]);
        this.setAttribute("data-drag", "");
      };

      const dropHandler = (e) => {
        if (this.readonly) return;

        const childIndex = e.dataTransfer
          .getData("item")
          .split(",")
          .map((n) => parseInt(n));
        let order = 0;

        if (e.target.hasAttribute("top")) {
          order = -1;
        }
        if (e.target.hasAttribute("bottom")) {
          order = 1;
        }

        this.moveObject(itemIndex, childIndex, order);

        dragEndHandler(e);
      };

      const renameItem = (e) => {
        if (this.readonly) return;

        e.target.setAttribute("contenteditable", "");
        e.target.focus();

        const submit = (e) => {
          e.target.removeAttribute("contenteditable");
          item.name = e.target.innerText;
          item.object.name = e.target.innerText;
          e.target.removeEventListener("blur", submit);
        };

        e.target.addEventListener("blur", submit);
      };

      let itemContextMenu = {};

      itemContextMenu["Delete"] = (target) => {
        this.scene.remove(item.object);
        this.updateScene();
      };

      const openItem = () => {
        this.dispatchEvent(new OpenFileEvent(item));
      };

      return html`
        <div class="layer" ?collapsed=${!item.uncollapsed}>
          <div
            class="item"
            children="${item.children.length}"
            .gyroContextMenu=${itemContextMenu}
            @drop=${dropHandler}
            @dragover=${dragOverHandler}
            @dragexit=${dragLeaveHandler}
            @dragleave=${dragLeaveHandler}
            @dragend=${dragEndHandler}
            @dragstart=${dragStartHandler}
            @dblclick=${openItem}
            @click=${selectItem}
            ?selected=${this.selection.has(itemIndex)}
          >
            <span class="collapse-btn" @click=${toggleCollapse}></span>

            <gyro-icon class="item-icon" icon="${typeIconMap[item.type]}"></gyro-icon>

            <span class="title" @dblclick=${renameItem}>${item.name}</span>

            <span class="tools">
              ${item.tools
                ? item.tools.map((tool) => {
                    return html`
                      <buton
                        title="${tool.name}"
                        class="icon-button tool-button"
                        @click=${(e) => tool.action(item, tool, e)}
                      >
                        <gyro-icon .icon="${tool.icon}"></gyro-icon>
                      </buton>
                    `;
                  })
                : ""}
            </span>
          </div>
          <div class="children">${item.uncollapsed ? renderTree(item.children) : ""}</div>
        </div>
      `;
    };

    const template = html`
      <style>
        ${componentStyles}
        ${styles}
      </style>
      <div class="root">${renderTree([tree])}</div>
    `;

    return template;
  }
}

customElements.define("gyro-outliner", Outliner);
