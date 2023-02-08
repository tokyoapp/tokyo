import chatStyles from "./Chat.style";
import Config from "atrium/lib/Config";
import { LitElement, html, css } from "lit-element";

const placeholderEmote = new Image();
placeholderEmote.src = "https://static-cdn.jtvnw.net/emoticons/v1/1/5.0";

export default class TwitchChat extends LitElement {
  render() {
    const toggleLight = () => {
      if (this.hasAttribute("light")) {
        this.removeAttribute("light");
      } else {
        this.setAttribute("light", "");
      }
    };

    return html`
      <style>
        ${chatStyles}
      </style>

      <div class="chat-preview">
        <div class="chat-titlebar">
          <span class="chat-title">Chat Preview</span>
          <div class="light-toggle" @click="${toggleLight}">
            <img
              src="https://cdn.frankerfacez.com/static/replacements/33-DansGame.png"
              height="24px"
            />
          </div>
        </div>
        <div class="twitch-chat-preview">
          <div class="twitch-chat-line">
            <span class="message"> Welcome to the chat room! </span>
          </div>
          <div class="twitch-chat-line">
            <span class="badge">
              <canvas pewview width="18" height="18"></canvas>
            </span>
            <span class="username">luckydye</span>
            <span class="sepearator">: </span>
            <span>A test message for testing</span>
            <span class="emote">
              <canvas pewview width="28" height="28"></canvas>
            </span>
            <span>emotes.</span>
          </div>
          <div class="twitch-chat-line">
            <span class="badge">
              <canvas pewview width="18" height="18"></canvas>
            </span>
            <span class="username">luckydye</span>
            <span class="sepearator">: </span>
            <span class="emote">
              <canvas pewview width="28" height="28"></canvas>
            </span>
            <span class="emote">
              <canvas pewview pewview2 width="28" height="28"></canvas>
            </span>
          </div>
        </div>
        <div class="emote-preview-container" ?hidden="${!this.showPreview}">
          <h2>Emotes</h2>
          <div class="image-preview">
            <canvas pewview class="emote-preview" width="112" height="112"></canvas>
            <canvas pewview class="emote-preview" width="56" height="56"></canvas>
            <canvas pewview class="emote-preview" width="28" height="28"></canvas>
          </div>
        </div>
        <div class="emote-preview-container" ?hidden="${!this.showPreview}">
          <h2>Badges</h2>
          <div class="image-preview">
            <canvas pewview class="emote-preview" width="72" height="72"></canvas>
            <canvas pewview class="emote-preview" width="36" height="36"></canvas>
            <canvas pewview class="emote-preview" width="18" height="18"></canvas>
          </div>
        </div>
        <div class="channel-rewards" ?hidden="${!this.showRewards}">
          <div class="title">Channel Rewards</div>
          <div class="rewards">
            <div class="reward">
              <div class="reward-inner">
                <canvas pewview class="emote-preview" width="28" height="28"></canvas>
                <div class="reward-price">
                  <svg width="12px" height="12px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px">
                    <g>
                      <path d="M10 6a4 4 0 014 4h-2a2 2 0 00-2-2V6z"></path>
                      <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0a6 6 0 11-12 0 6 6 0 0112 0z"
                        clip-rule="evenodd"
                      ></path>
                    </g>
                  </svg>
                  50,000
                </div>
              </div>
              <span>Do something</span>
            </div>
          </div>
        </div>
        <div class="fake-chat-input">
          <div class="chat-input"></div>
          <div class="chat-input-footer">
            <div class="chat-button channel-points">
              <canvas
                pewview
                class="emote-preview channel-points-badge"
                width="20"
                height="20"
              ></canvas>
              <span>50.5K</span>
            </div>
            <div class="chat-button chat-submit-button"></div>
          </div>
        </div>
      </div>
    `;
  }

  get showPreview() {
    return this._showPreview;
  }
  set showPreview(val) {
    this._showPreview = val;
    this.update();
  }

  get showRewards() {
    return this._showRewards;
  }
  set showRewards(val) {
    this._showRewards = val;
    this.update();
  }

  constructor() {
    super();

    this._showPreview = true;
    this._showRewards = true;
  }

  connectedCallback() {
    super.connectedCallback();
    requestAnimationFrame(() => {
      this.updateEmotes();
      placeholderEmote.onload = () => {
        this.updateEmotes();
      };
    });
  }

  updateEmotes(croppedImage) {
    const canvases = this.shadowRoot.querySelectorAll("canvas[pewview]");

    for (let canvas of canvases) {
      let ar = canvas.width / canvas.height;
      const center = [canvas.width / 2, canvas.height / 2];

      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (!Config.global.getValue("rendering.smooth")) {
        canvas.style.imageRendering = "pixelated";
        context.mozImageSmoothingEnabled = false;
        context.webkitImageSmoothingEnabled = false;
        context.msImageSmoothingEnabled = false;
        context.imageSmoothingEnabled = false;
      } else {
        canvas.style.imageRendering = "optimizequality";
        context.mozImageSmoothingEnabled = true;
        context.webkitImageSmoothingEnabled = true;
        context.msImageSmoothingEnabled = true;
        context.imageSmoothingEnabled = true;
      }

      if (croppedImage && croppedImage.width > 0) {
        const w = canvas.width;
        const h = canvas.width / ar;
        const x = center[0] - w / 2;
        const y = center[1] - h / 2;

        context.drawImage(croppedImage, 0, 0, canvas.width, canvas.height);
      } else {
        ar = placeholderEmote.width / placeholderEmote.height;

        const w = canvas.width;
        const h = canvas.width / ar;
        const x = center[0] - w / 2;
        const y = center[1] - h / 2;

        context.drawImage(placeholderEmote, x, y, w, h);
      }
    }
  }
}

customElements.define("twitch-chat", TwitchChat);
