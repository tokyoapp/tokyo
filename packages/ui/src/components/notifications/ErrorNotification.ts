import { html, css } from 'lit';
import Notification from './Notification';

export default class ErrorNotification extends Notification {
  static get styles() {
    return css`
      ${Notification.styles}

      span {
        display: flex;
        align-items: center;
      }

      .wrapper {
        justify-content: space-between;
        background: #f44040;
        color: white;
      }

      .icon {
        display: inline-block;
        margin-right: 8px;
        margin-bottom: -1px;
        margin-left: -5px;
        flex: none;
      }
    `;
  }

  protected render() {
    return html`
      <div class="wrapper">
        <span>
          <svg class="icon" width="16" height="16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" stroke="white" stroke-width="4"/>
            <path d="M30.091 37.273L30.091 16L33.829 16L33.829 37.273L30.091 37.273ZM29.293 43.951C29.293 43.587 29.37 43.244 29.524 42.922C29.664 42.614 29.86 42.334 30.112 42.082C30.35 41.844 30.637 41.655 30.973 41.515C31.295 41.375 31.638 41.305 32.002 41.305C32.366 41.305 32.709 41.375 33.031 41.515C33.339 41.655 33.612 41.844 33.85 42.082C34.088 42.334 34.277 42.614 34.417 42.922C34.557 43.244 34.627 43.587 34.627 43.951C34.627 44.315 34.557 44.658 34.417 44.98C34.277 45.316 34.088 45.603 33.85 45.841C33.612 46.093 33.339 46.289 33.031 46.429C32.709 46.569 32.366 46.639 32.002 46.639C31.638 46.639 31.295 46.569 30.973 46.429C30.637 46.289 30.35 46.093 30.112 45.841C29.86 45.603 29.664 45.316 29.524 44.98C29.37 44.658 29.293 44.315 29.293 43.951Z" fill="white"/>
          </svg>

          <span>${this.message}</span>
        </span>
      </div>
    `;
  }
}

customElements.define('ui-error-notification', ErrorNotification);
