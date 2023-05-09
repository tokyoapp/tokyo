import Column from "./Column";

export default class Group extends Column {
  static get observedAttributes() {
    return ["active-tab", "show-tabs"];
  }

  static get template() {
    const groupTemplate = document.createElement("template");
    groupTemplate.innerHTML = `
			<style>
				:host {
					position: relative;
					overflow: hidden;
					z-index: 1000;
					display: flex;
					flex-direction: column;
					background: var(--panel-background);
					color: var(--tab-font-color);

					--tab-height: 22px;
					--tab-width: auto;
					--tab-font-size: 11px;
					--tab-border-radius: 3px;
					--tab-padding: 3px 20px;
					--tab-border: none;
				}

				.tabs {
					display: flex;
					background: var(--tabs-background);
					font-family: sans-serif;
					color: #b5b5b5;
					z-index: 1000;
					pointer-events: all;
					user-select: none;
					font-size: var(--tab-font-size);
					padding: 0;
				}

				.tab {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					background: var(--tab-background);
					margin: 0 1px 0 0;
					height: var(--tab-height);
					cursor: pointer;
					position: relative;
					min-width: var(--tab-width);
					padding: var(--tab-padding);
					border-bottom: var(--tab-bottom-border);
					color: var(--tab-font-color);
					opacity: 0.5;
					border-top-left-radius: var(--tab-border-radius);
					border-top-right-radius: var(--tab-border-radius);
					border: var(--tab-border);
				}

				.tab[data-groupid] {
					-webkit-user-drag: element;
				}

				.tab[active] {
					background: var(--tab-active-background);
					border-bottom: var(--tab-active-bottom-border);
					opacity: 1;
				}

				.tab::before {
					content: "";
					position: absolute;
					pointer-events: none;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
				}

				.tab:hover {
					background: var(--tab-hover-background);
				}

				.tab:active {
					background: var(--tab-active-background);
					opacity: 1;
				}

				slot {
					display: block;
					position: absolute;
					top: 0;
					left: 0;
					bottom: 0;
					right: 0;
				}

				:host([show-tabs]) slot {
					top: 30px;
				}

				:host([drag-over]) {
					--left: 0;
					--top: 0;
					--width: 100%;
					--height: 100%;
				}

				:host([drag-over])::after {
					content: '';
					background: white;
					opacity: 0.05;
					position: absolute;
					top: var(--top);
					left: var(--left);
					z-index: 10000;
					width: var(--width);
					height: var(--height);
					pointer-events: none;
				}
			</style>
			<div class="tabs"></div>
		`;
    return groupTemplate.content;
  }

  get activeTab() {
    if (this.hasAttribute("active-tab")) {
      return +(this.getAttribute("active-tab") || 0);
    } else {
      return -1;
    }
  }

  set activeTab(index: number) {
    this.setActiveTab(index);
  }

  get tabs() {
    if (!this.shadowRoot) {
      return this.attachShadow({ mode: "open" });
    }
    return this.shadowRoot.querySelectorAll(".tabs .tab[data-groupid]");
  }

  get components() {
    return [...this.children].filter((ele) => ele.hasAttribute("tab"));
  }

  constructor() {
    super();

    this.shadowRoot?.appendChild(Group.template);
    this.shadowRoot?.appendChild(this.shadowSlot);

    this.initializeDragAndDropHandlers();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    if (name === "active-tab") {
      this.activeTab = +newValue;
    }

    this.renderTabs();
  }

  connectedCallback() {
    // override default
  }

  slotChangeCallback(e: Event) {
    super.slotChangeCallback(e);

    this.renderTabs();
    this.setActiveTab(this.components.length - 1);
  }

  initializeDragAndDropHandlers() {
    let insertPosition = 0;

    const dragOverHandler = (e: DragEvent) => {
      if (!document.body.hasAttribute("layout-drag")) return;

      e.preventDefault();

      const bounds = this.getBoundingClientRect();

      const x = e.x;
      const y = e.y;

      const area = Math.min(bounds.height / 8, bounds.width / 8);

      this.removeAttribute("style");
      insertPosition = 0;

      if (y < bounds.top + area) {
        this.style.setProperty("--height", area + "px");

        insertPosition = -1;
      } else if (y > bounds.bottom - area) {
        this.style.setProperty("--height", area + "px");
        this.style.setProperty("--top", bounds.height - area + "px");

        insertPosition = 1;
      } else if (x < bounds.left + area) {
        this.style.setProperty("--width", area + "px");

        insertPosition = -2;
      } else if (x > bounds.right - area) {
        this.style.setProperty("--width", area + "px");
        this.style.setProperty("--left", bounds.width - area + "px");

        insertPosition = 2;
      }

      this.setAttribute("drag-over", "");

      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
    };

    const dragEndHandler = (e: Event) => {
      dragLeaveHandler(e);

      if (document.body.hasAttribute("layout-drag")) {
        document.body.removeAttribute("layout-drag");
      }
    };

    const dragLeaveHandler = (e: Event) => {
      this.removeAttribute("drag-over");
      this.removeAttribute("style");
    };

    const dragDropHandler = (e: DragEvent) => {
      e.preventDefault();

      dragEndHandler(e);

      const targetId = e.dataTransfer?.getData("tab");

      if (!targetId) return;

      const component = document.querySelector("[" + targetId + "]");

      if (!component) return;

      if (insertPosition === 0 && component.parentNode === this) return;

      component.parentNode?.removeChild(component);

      // apend inside
      if (insertPosition === 0) {
        this.appendChild(component);
      }

      // vertical
      if (Math.abs(insertPosition) === 1) {
        const oldHeight = this.height;
        const newGroup = this.cloneNode();

        newGroup.appendChild(component);

        // apend above
        if (insertPosition < 0) {
          newGroup.height = oldHeight / 2;
          this.height -= oldHeight / 2;
          this.parentNode.insertBefore(newGroup, this);
        }

        // apend below
        if (insertPosition > 0) {
          newGroup.height = oldHeight / 2;
          this.height -= oldHeight / 2;
          this.parentNode.insertBefore(newGroup, this.nextSibling);
        }
      }

      // horizontal
      if (Math.abs(insertPosition) === 2) {
        const oldWidth = this.parentNode.width;
        const newColumn = this.parentNode.cloneNode();
        const newGroup = this.cloneNode();

        newGroup.appendChild(component);
        newColumn.appendChild(newGroup);

        // apend to the left
        if (insertPosition < 0) {
          this.parentNode.width -= oldWidth / 2;
          newColumn.width = oldWidth / 2;
          this.parentNode.parentNode.insertBefore(newColumn, this.parentNode);
        }

        // apend to the right
        if (insertPosition > 0) {
          this.parentNode.width -= oldWidth / 2;
          newColumn.width = oldWidth / 2;
          this.parentNode.parentNode.insertBefore(newColumn, this.parentNode.nextSibling);
        }
      }
    };

    this.addEventListener("dragover", dragOverHandler);
    this.addEventListener("dragleave", dragLeaveHandler);
    this.addEventListener("dragend", dragEndHandler);
    this.addEventListener("drop", dragDropHandler);
  }

  // updates tabs bar if components have changed
  renderTabs() {
    const tabs = this.shadowRoot.querySelector(".tabs");
    tabs.innerHTML = "";

    // creates tab ele for component
    const createTab = (component) => {
      const tab = document.createElement("span");
      tab.setAttribute("draggable", "true");
      tab.className = "tab";

      if (component) {
        const groupid = component.getAttribute("tab");

        if (groupid) {
          tab.innerText = component.name || groupid;
          tab.dataset.groupid = groupid;
        }

        tab.onmousedown = (e) => {
          const index = [...tab.parentNode.children].indexOf(tab);
          this.activeTab = index;
        };

        tab.ondragstart = (e) => {
          document.body.setAttribute("layout-drag", "");
          e.dataTransfer.setData("tab", "drag-target");
          component.setAttribute("drag-target", "");
        };

        tab.ondragend = (e) => {
          setTimeout(() => {
            component.removeAttribute("drag-target");
          }, 10);
        };
      }

      return tab;
    };

    const components = this.components;

    if (components.length > 1 || this.hasAttribute("show-tabs")) {
      for (let i = 0; i < components.length; i++) {
        const tab = createTab(components[i]);
        tabs.appendChild(tab);
      }
    }

    // set active tab if undefined
    if (this.activeTab == undefined) {
      this.activeTab = 0;
    }

    if (this.activeTab > this.tabs.length - 1) {
      this.activeTab = Math.max(this.tabs.length - 1, 0);
    }
  }

  // updates components and tab bar if active tab changed
  setActiveTab(index: number) {
    const tabs = this.tabs;
    const components = this.components;

    for (let i = 0; i < components.length; i++) {
      const tab = tabs[i];

      if (tab) {
        if (i == index) {
          tab.setAttribute("active", "");
        } else {
          tab.removeAttribute("active");
        }
      }

      if (components[i]) {
        if (i == index) {
          components[i].setAttribute("active", "");
        } else {
          components[i].removeAttribute("active");
        }
      }
    }
  }
}

customElements.define("gyro-group", Group);
