import { css, html, LitElement } from 'lit-element';

export default class StartComponent extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: center;
        padding: 40px;
      }
      .container {
        max-width: 800px;
        width: 100%;
      }
      h2 {
        font-weight: 400;
        font-size: 32px;
      }
    `;
  }

  connectedCallback() {
    super.connectedCallback();
  }

  render() {
    return html`
      <div class="container">
        <h2>Start</h2>
      </div>
    `;
  }
}

customElements.define('atrium-start', StartComponent);
