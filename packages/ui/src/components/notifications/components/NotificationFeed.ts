import { html, css, LitElement } from 'lit';

let instance: NotificationFeed | null = null;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'notification-feed': NotificationFeed;
    }
  }
}

export default class NotificationFeed extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }
    `;
  }

  constructor() {
    super();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this;
  }

  protected render() {
    return html`
      <div>
        <slot></slot>
      </div>
    `;
  }

  static getInstance() {
    if (!instance) {
      instance = new NotificationFeed();
    }
    return instance;
  }
}

customElements.define('notification-feed', NotificationFeed);
