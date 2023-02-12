import { html } from "lit-element";
import Config from "atrium/lib/Config";

const config = Config.global.load();

export default {
  title: "Emote Editor",
  icon: "Preset",
  content: () => {
    const chat = document.querySelector("twitch-chat");

    return html`
      <style>
        .row {
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 500px;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .row.header {
          padding: 8px 0;
          margin: 0 0 20px 0;
          border-radius: 4px;
          border: none;
          opacity: 0.5;
        }
        input-switch {
          margin-left: 15px;
        }
      </style>
      <div class="row header">Appearance</div>

      <div class="row">
        <label>Show emote preview</label>
        <input-switch
          ?checked="${chat.showPreview}"
          @change="${function (e) {
            chat.showPreview = e.target.checked;
          }}"
        ></input-switch>
      </div>
      <div class="row">
        <label>Show rewards preview</label>
        <input-switch
          ?checked="${chat.showRewards}"
          @change="${function (e) {
            chat.showRewards = e.target.checked;
          }}"
        ></input-switch>
      </div>

      <div class="row header">Rendering</div>

      <div class="row">
        <label>Smooth rendering</label>
        <input-switch
          ?checked="${config.getValue("rendering.smooth")}"
          @change="${function (e) {
            config.setValue("rendering.smooth", e.target.checked);
            config.save();
            const editor = document.querySelector("gyro-emote-editor");
            editor.dispatchEvent(new Event("change"));
          }}"
        ></input-switch>
      </div>
    `;
  },
};
