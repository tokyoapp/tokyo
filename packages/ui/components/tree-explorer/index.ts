import { html, css, LitElement } from 'lit-element';
import typeIconMap from './TypeIcons';
import fileExtensions from './FileExtensionTypes';
import FileExplorerStyles from './FileExplorer.style';

class OpenFileEvent extends Event {
  constructor(file) {
    super('openfile');
    this.file = file;
  }
}

class AddFileEvent extends Event {
  constructor(file) {
    super('addfile');
    this.file = file;
  }
}

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

export default class FileExplorer extends LitElement {
  static get styles() {
    return FileExplorerStyles;
  }

  showRoot = false;

  selection = new Set();
  lastItemIndex = null;
  readonly = true;
  filter = {
    name: /.*/g,
  };
  results = [];

  constructor() {
    super();

    window.addEventListener('keydown', (e) => {
      if (e.key == 'ArrowUp') {
        const newSelection = new Set();
        newSelection.add([...this.selection][0] - 1);
        this.selection = newSelection;
      }
      if (e.key == 'ArrowDown') {
        const newSelection = new Set();
        newSelection.add([...this.selection][0] + 1);
        this.selection = newSelection;
      }
      if (e.key == 'ArrowLeft') {
        const selected = [...this.selection][0];
        const item = this.getItemByIndex(selected);
        this.toggleCollapse(item, false);
      }
      if (e.key == 'ArrowRight') {
        const selected = [...this.selection][0];
        const item = this.getItemByIndex(selected);
        this.toggleCollapse(item, true);
      }
      if (e.key == 'Enter') {
        const selected = [...this.selection][0];
        const item = this.getItemByIndex(selected);
        this.dispatchEvent(new OpenFileEvent(item));
      }
      this.update();

      e.stopImmediatePropagation();
    });
  }

  setFilter(key, regex) {
    this.filter[key] = regex;
  }

  setRoot(tree) {
    this.tree = tree;
    this.update();
  }

  findItem(searchString, children, results = []) {
    if (searchString == '') {
      return [];
    }

    children = children || this.tree.children;

    for (let item of children) {
      if (item.name.match(searchString)) {
        results.push(item);
      } else {
        this.findItem(searchString, item.children, results);
      }
    }

    return results;
  }

  getItemByIndex(itemIndex) {
    let index = -1;
    let foundItem = null;

    const currate = (tree) => {
      for (let item of tree) {
        index++;

        if (index === itemIndex) {
          foundItem = item;
        }

        if (item.uncollapsed && item.children) {
          currate(item.children);
        }
      }
    };

    currate([this.tree]);

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

    this.update();
  }

  filterItem(item) {
    return item.name.match(this.filter.name);
  }

  toggleCollapse(item, state) {
    state = state != null ? state : !item.uncollapsed;
    item.uncollapsed = state;
    this.update();
  }

  render() {
    if (!this.tree) {
      return html`
                <div></div>
                <div class="root">
                    <div class="placeholder">
                        <gyro-icon icon="File"></gyro-icon>
                        <span class="text">Import archives to browse files.</span>
                    </div>
                </div>
            `;
    }

    let index = 0;

    let tree = this.tree;

    if (this.results.length > 0) {
      tree = {
        name: 'results',
        type: 'root',
        tools: [],
        uncollapsed: true,
        children: this.results,
      };
    }

    const objectArray = [];

    const renderTree = (group) => {
      return group.map((item) => renderItem(item));
    };

    let oddEven = true;

    const renderItem = (item) => {
      if (item.type == undefined) {
        item.type = getTypeByFilename(item.name);
      }

      if (item.type !== 'folder' && item.type !== 'root' && !this.filterItem(item)) {
        return;
      }

      const itemIndex = index++;
      objectArray[itemIndex] = item.object;

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
        e.target.setAttribute('target', '');
        e.dataTransfer.dropEffect = 'move';

        const bounds = e.target.getBoundingClientRect();
        const height = bounds.height;
        const y = e.y - bounds.y;

        if (y < height * (1 / 5)) {
          e.target.setAttribute('top', '');
        } else if (y > height * (4 / 5)) {
          e.target.setAttribute('bottom', '');
        } else {
          e.target.removeAttribute('top');
          e.target.removeAttribute('bottom');
        }
      };

      const dragEndHandler = (e) => {
        if (this.readonly) return;

        dragLeaveHandler(e);
        this.removeAttribute('data-drag');
      };

      const dragLeaveHandler = (e) => {
        if (this.readonly) return;

        e.target.removeAttribute('target');
        e.target.removeAttribute('top');
        e.target.removeAttribute('bottom');
      };

      const dragStartHandler = (e) => {
        if (this.readonly) return;

        e.dataTransfer.setData('item', [...this.selection]);
        this.setAttribute('data-drag', '');
      };

      const dropHandler = (e) => {
        if (this.readonly) return;

        const childIndex = e.dataTransfer
          .getData('item')
          .split(',')
          .map((n) => parseInt(n));
        let order = 0;

        if (e.target.hasAttribute('top')) {
          order = -1;
        }
        if (e.target.hasAttribute('bottom')) {
          order = 1;
        }

        this.moveObject(itemIndex, childIndex, order);
        dragEndHandler(e);
      };

      const renameItem = (e) => {
        if (this.readonly) return;

        e.target.setAttribute('contenteditable', '');
        e.target.focus();

        const submit = (e) => {
          e.target.removeAttribute('contenteditable');
          item.name = e.target.innerText;
          item.object.name = e.target.innerText;
          e.target.removeEventListener('blur', submit);
        };

        e.target.addEventListener('blur', submit);
      };

      // let itemContextMenu = {
      //     'Collapse': (target) => {
      //         this.toggleCollapse(item)
      //     }
      // };

      // if(item.type !== "folder" && item.type !== "root") {
      //     itemContextMenu['Open'] = (target) => {
      //         this.dispatchEvent(new OpenFileEvent(item));
      //     }
      //     itemContextMenu['Add'] = (target) => {
      //         this.dispatchEvent(new AddFileEvent(item));
      //     }
      // }

      const openItem = () => {
        this.dispatchEvent(new OpenFileEvent(item));
      };

      oddEven = !oddEven;

      return html`
                <div class="layer" ?even="${oddEven}" ?odd="${!oddEven}" ?collapsed=${!item.uncollapsed}>
                    <div class="item"
                        @drop=${dropHandler} 
                        @dragover=${dragOverHandler} 
                        @dragexit=${dragLeaveHandler} 
                        @dragleave=${dragLeaveHandler} 
                        @dragend=${dragEndHandler} 
                        @dragstart=${dragStartHandler} 
                        @dblclick=${openItem}
                        @mousedown=${selectItem}
                        ?selected=${this.selection.has(itemIndex)}>
                    
                        ${
                          (item.children && item.children.length) > 0
                            ? html`<span class="collapse-btn" @mousedown=${(e) =>
                                this.toggleCollapse(item)}></span>`
                            : ''
                        }

                        <gyro-icon class="item-icon" icon="${typeIconMap[item.type] || 'Document'}"></gyro-icon>

                        <span class="title" @dblclick=${renameItem}>${item.name}</span>

                        <span class="tools">
                            ${
                              item.tools
                                ? item.tools.map((tool) => {
                                    return html`
                                    <buton title="${tool.name}" class="icon-button tool-button" @click=${tool.action}>
                                        <gyro-icon icon="${tool.icon}"></gyro-icon>
                                    </buton>
                                `;
                                  })
                                : ''
                            }
                        </span>

                    </div>
                    <div class="children">
                        ${item.uncollapsed ? renderTree(item.children) : ''}
                    </div>
                </div>
            `;
    };

    const searchChangeHandler = (e) => {
      const input = this.shadowRoot.querySelector('.search-input');
      const items = this.findItem(input.value);

      this.results = items;
      this.update();
    };

    const template = html`
            <div class="search">
                <gyro-input class="search-input" placeholder="Search" @change=${searchChangeHandler}></gyro-input>
            </div>
            <div class="root">
                ${renderTree(this.showRoot ? [tree] : tree.children)}
            </div>
        `;

    return template;
  }
}

customElements.define('gyro-explorer', FileExplorer);

function getTypeByFilename(filename) {
  const parts = filename.split('.');
  const ext = parts[parts.length - 1];

  for (let key in fileExtensions) {
    for (let extPattern of fileExtensions[key]) {
      if (ext.toLocaleLowerCase() == extPattern.toLocaleLowerCase()) {
        return key;
      }
    }
  }
}
