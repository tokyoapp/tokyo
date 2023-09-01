import { html, css, LitElement } from 'lit-element';

export default class DropdownButton extends LitElement {
  static get properties() {
    return {
      value: {},
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
        outline: none;
        color: white;
        font-family: sans-serif;
        font-size: 12px;
        text-transform: capitalize;
      }

      :host(:focus) {
        background: rgba(52, 52, 52, 0.75);
      }

      :host {
        width: auto;
        line-height: 15px;
        cursor: pointer;
        padding: 3px 6px;
        box-sizing: content-box;
        background: rgba(15, 15, 15, 0.5);
      }

      :host(:hover) {
        background: rgba(52, 52, 52, 0.75);
      }

      :host([active]) .options {
        visibility: visible;
      }

      .options {
        visibility: hidden;
        position: absolute;
        top: 100%;
        margin-top: 2px;
        left: 0;
        background: rgba(25, 25, 25, 1);
        border-radius: 4px;
        overflow: hidden;
        min-width: 100%;
      }

      .options span {
        padding: 5px 8px;
        display: block;
        cursor: pointer;
      }

      .options span:hover {
        background: rgba(100, 100, 100, 0.75);
      }

      .options span:active {
        filter: brightness(0.9);
      }
    `;
  }

  render() {
    const options = this.props.options || [];
    const onSelect = this.props.onSelect;
    const value = this.props.value ? this.props.value.name : options[0] ? options[0].name : 'none';

    return html`
      <div class="value">${value}</div>
      <div class="options">
        ${options.map((opt) => {
          return html`<span @click=${() => onSelect(opt)}>${opt.name}</span>`;
        })}
      </div>
    `;
  }

  get value() {
    return this.props.value;
  }

  set value(val) {
    this.props.value = val;
  }

  get options() {
    return this.props.options || [];
  }

  set options(arr) {
    this.props.options = arr;
    this.update();
  }

  constructor() {
    super();

    this.props = {};
    this.props.onSelect = (opt) => {
      this.value = opt;

      this.dispatchEvent(new Event('change'));
      this.update();
      this.blur();
    };
  }

  connectedCallback() {
    super.connectedCallback();

    this.tabIndex = 0;

    this.addEventListener('focus', (e) => {
      this.setAttribute('active', '');
    });

    this.addEventListener('blur', (e) => {
      this.removeAttribute('active');
    });

    if (this.options && this.options.length < 1) {
      const childOptions = [];
      for (let child of this.children) {
        childOptions.push({
          name: child.getAttribute('name'),
          value: child.getAttribute('value'),
        });
      }
      this.options = childOptions;
    }
  }
}

customElements.define('dropdown-button', DropdownButton);
