import { Action } from 'atrium/lib/Actions';
import '../Icon';
import { html, css, LitElement } from 'lit-element';

export class MenuItem extends LitElement {
  static get styles() {
    return css`
      :host(:focus) .menu {
        display: block;
        cursor: pointer;
        margin: 5px 5px;
        border-radius: 3px;
        color: var(--global-font-color);
      }

      .menu {
        padding: 5px;
        position: absolute;
        top: -2px;
        left: 90%;
        box-shadow: 1px 2px 6px rgba(0, 0, 0, 0.15);
        min-width: 200px;
        background: var(--background-color);
        border: 1px solid var(--gyro-pallate-panel-content);
        display: none;
        z-index: 100;
        color: var(--gyro-pallate-text);
        overflow: auto;
        border-radius: 6px;
        border: 1px solid rgb(37 37 37);
      }

      :host {
        user-select: none;
        position: relative;
        outline: none;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--gyro-pallate-text);
        pointer-events: all;
        cursor: pointer;
        height: 50px;
      }

      gyro-icon {
        opacity: 0.5;
      }

      :host(:hover) gyro-icon {
        opacity: 0.8;
      }
      :host(:active) gyro-icon {
        opacity: 1;
      }

      .button:hover .tooltip {
        opacity: 1;
      }

      .tooltip {
        position: absolute;
        opacity: 0;
        pointer-events: none;
        font-size: 13px;
        padding: 0 8px;
        line-height: 28px;
        border-radius: 4px;
        left: 100%;
        top: 50%;
        transform: translate(8px, -50%);
        background: var(--background-color);
        transition: opacity 0.05s ease-out;
        white-space: nowrap;
        box-shadow: 1px 2px 8px rgba(0, 0, 0, 0.25);
      }

      .tooltip::after {
        content: attr(title);
      }
    `;
  }

  render() {
    const icon = this.props ? this.props.icon : '';
    const title = this.props ? this.props.title : '';

    return html`
      <div class="menu">
        <slot></slot>
        ${
          this.item?.options?.map((optn) => {
            const optionEle = new MenuOption();
            optionEle.setAttribute('title', optn.title);
            if (optn.seperator) {
              optionEle.setAttribute('seperator', '');
            }
            if (optn.action) {
              if (typeof optn.action == 'string') {
                optionEle.setAttribute('action', optn.action);
              } else if (optn.action instanceof Object) {
                optionEle.setAttribute('action', optn.action.name);
                optionEle.options = optn.action.args;
              }
            }

            return html`${optionEle}`;
          }) || ''
        }
      </div>
      <div class="button">
        ${icon ? html`<gyro-icon icon="${icon}"></gyro-icon>` : html` <slot name="icon"></slot> `}
        ${title ? html`<span class="tooltip" title="${title}"></span>` : ''}
      </div>
    `;
  }

  get action() {
    return this.getAttribute('action');
  }

  get require() {
    return this.getAttribute('require');
  }

  item: Array<any> | undefined;

  constructor(item?: Array<any>) {
    super();

    this.item = item;

    this.onfocus = () => {
      if (this.action || this.require) {
        this.blur();
      } else {
        const menu = this.shadowRoot?.querySelector('.menu');

        const container = this.parentNode.parentNode;
        const height = container.clientHeight - this.parentNode.offsetHeight - 10;

        menu.style.maxHeight = height + 'px';
      }
    };

    this.onclick = (e) => {
      const action = this.action ? this.action.split(':') : null;
      const require = this.require ? this.require.split(':') : null;

      if (action) {
        const action = this.action.split(':');
        Action.execute(action[0], [...action.slice(1)]);
      }

      if (require) {
        // dialog("You will loose your unsaved changes", e).then(comfirmed => {
        //     if (comfirmed) {
        //         Action.execute(require[0], [...require.slice(1)]);
        //     }
        // });
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();

    this.props = {
      icon: this.getAttribute('icon'),
      title: this.getAttribute('title'),
    };

    if (this.props.icon) {
      this.removeAttribute('title');
    }

    this.render();

    this.title = this.title;
    this.tabIndex = 0;
  }
}

export class MenuOption extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        padding: 8px 10px;
        border-radius: 4px;
        white-space: nowrap;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      :host(.disabled) {
        opacity: 0.335;
        pointer-events: none;
      }

      :host(:hover) {
        background: rgba(255, 255, 255, 0.1);
      }

      :host(:active) {
        background: rgba(255, 255, 255, 0.05);
      }

      :host([seperator]) {
        border-radius: 0;
        margin-bottom: 4px;
        margin-top: 4px;
        padding: 4px 5px;
        margin-left: 4px;
        margin-right: 4px;
      }
    `;
  }

  static get properties() {
    return {
      action: { type: String },
      require: { type: Boolean },
      title: { type: String },
    };
  }

  get action() {
    return this.getAttribute('action');
  }

  get require() {
    return this.getAttribute('require');
  }

  options: Object;

  constructor() {
    super();

    this.options = {};

    this.addEventListener('click', this.onClick);
  }

  attributeChangedCallback() {
    super.attributeChangedCallback();

    if (!this.action && !this.require) {
      this.className = 'disabled';
    } else {
      this.classList.remove('disabled');
    }

    this.update({});
  }

  render() {
    return html` ${this.getAttribute('title')} `;
  }

  onClick(e) {
    // const actionParts = this.action ? this.action.split(":") : null;
    const require = this.require ? this.require.split(':') : null;

    // if (actionParts) {
    // const options = [...actionParts.slice(1)];
    // options.push(this.options);
    if (this.action) {
      Action.execute(this.action, [this.options], null);
    }
    // }

    if (require) {
      // dialog("You will loose your unsaved changes", e).then(comfirmed => {
      //     if (comfirmed) {
      //         Action.execute(require[0], [...require.slice(1)]);
      //     }
      // });
    }
  }
}

export class Menubar extends LitElement {
  update() {
    super.update();

    const items = document.querySelectorAll('gyro-menuitem');
    for (let child of items) {
      child.update();
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define('gyro-menubar', Menubar);
customElements.define('gyro-menuitem', MenuItem);
customElements.define('gyro-menuoption', MenuOption);
