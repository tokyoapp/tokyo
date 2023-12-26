import { html, css, LitElement } from 'lit';

interface NotificationOptions {
  message?: string;
  time?: number;
}

export default class Notification extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
        font-size: 14px;
        line-height: 100%;
        color: #eee;
        transition: opacity 1s ease, height 0.75s ease;
        cursor: default;
      }

      :host(:hover) .wrapper {
        filter: brightness(0.98);
      }

      :host(:active) .wrapper {
        filter: brightness(0.95);
      }

      .wrapper {
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 2px, 8px, 0.07);
        padding: 6px 18px;
        background: rgb(39 39 42 / 1);
        border: 1px solid rgb(24 24 27 / 1);
        min-height: 40px;
        min-width: 220px;
        display: flex;
        align-items: center;
        animation: slide-in 0.5s ease;
        box-sizing: border-box;
        margin-bottom: 5px;
        z-index: -1;
      }

      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateY(-40px);
        }
      }
    `;
  }

  message?: string;
  time?: number;

  constructor(options: NotificationOptions) {
    super();

    this.message = options.message;
    this.time = options.time;

    this.addEventListener('click', () => {
      setTimeout(() => {
        this.kill();
      }, 100);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (this.time) {
      setTimeout(() => {
        this.kill();
      }, this.time);
    }
  }

  kill() {
    this.style.height = `${this.offsetHeight + 5}px`;

    this.offsetHeight;

    this.style.opacity = '0';
    this.style.height = '0px';

    setTimeout(() => {
      this.remove();
    }, 1000);
  }

  protected render() {
    return html`
      <div class="wrapper">
        <span>${this.message}</span>
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('ui-notification', Notification);
