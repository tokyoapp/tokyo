import { css } from "lit-element";

export default css`
  :host {
    --twitch-chat-background: hsl(240, 0%, 10%);
    --twitch-chat-input-background: rgba(255, 255, 255, 0.15);
    --twitch-chat-color: #fff;
    --twitch-chat-title-color: #e0e0e0;
    --twitch-chat-points-color: #b3b3b3;
    --twitch-chat-title-border: 1px solid rgba(255, 255, 255, 0.1);
  }

  :host([light]) {
    --twitch-chat-background: #ffffff;
    --twitch-chat-input-background: #f2f2f2;
    --twitch-chat-color: #0e0e10;
    --twitch-chat-title-color: rgb(31, 31, 35);
    --twitch-chat-points-color: rgb(83, 83, 95);
    --twitch-chat-title-border: 1px solid rgba(0, 0, 0, 0.1);
  }

  [hidden] {
    display: none !important;
  }

  h2 {
    font-size: 14px;
    font-weight: normal;
    margin: 0 0 20px 0;
  }

  .chat-preview {
    height: 100%;
    box-sizing: border-box;
    background-color: var(--twitch-chat-background);
    display: flex;
    flex-direction: column;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--twitch-chat-color);
  }

  .chat-titlebar {
    width: 100%;
    height: 50px;
    border-bottom: var(--twitch-chat-title-border);
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .chat-titlebar .light-toggle {
    position: absolute;
    right: 10px;
    width: 30px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    cursor: pointer;
  }

  .chat-titlebar .light-toggle:hover {
    background: var(--twitch-chat-input-background);
  }

  .chat-title {
    text-transform: uppercase;
    font-family: "Roboto", sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--twitch-chat-title-color);
  }

  .emote-preview-container {
    padding: 1rem 1rem;
  }

  .emote-preview-container .emote-preview {
    margin-right: 10px;
  }

  .image-preview {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    border-radius: 6px;
  }

  .twitch-chat-preview {
    font-family: "Roboto", sans-serif;
    margin-top: 5px;
    flex: 1;
  }

  .twitch-chat-line {
    padding: 0.3rem 1rem;
    line-height: 20px;
    font-size: 0;
  }

  .twitch-chat-line span {
    display: inline-flex;
    height: 14px;
    align-items: center;
    vertical-align: middle;
    font-size: 13px;
    margin-right: 3px;
  }

  .twitch-chat-line .message {
    opacity: 0.5;
  }

  .twitch-chat-line .sepearator {
    width: 5px;
  }

  .twitch-chat-line .username {
    font-weight: 500;
    color: #29b3dc;
    margin: 0;
  }

  .fake-chat-input {
    padding-left: 0.55rem !important;
    padding-right: 0.55rem !important;
    padding-bottom: 0.55rem !important;
    margin-top: 20px;
  }

  .chat-input {
    width: 100%;
    height: 42px;
    background: var(--twitch-chat-input-background);
    border-radius: 4px;
  }

  .chat-input-footer {
    margin-top: 0.55rem !important;
    display: flex;
    justify-content: space-between;
  }

  .chat-button {
    min-width: 48px;
    height: 30px;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 10px;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }

  .chat-button:hover::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    opacity: 0.125;
  }

  .channel-points {
    color: var(--twitch-chat-points-color);
    font-weight: 600;
    font-size: 12px;
  }

  .channel-points-badge {
    margin-right: 5px;
  }

  .chat-submit-button {
    background: rgb(145, 71, 255);
  }

  .channel-rewards {
    margin-left: 0.55rem;
    margin-right: 0.55rem;
    margin-top: 10px;
    background-color: var(--twitch-chat-background);
    box-shadow: 0 1px 4px 2px rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .channel-rewards .title {
    padding: 0.33rem 0.55rem;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 15px;
    font-weight: 500;
    box-shadow: 0 1px 1px 1px rgba(0, 0, 0, 0.2);
  }

  .channel-rewards .rewards {
    padding: 0.55rem;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }

  .channel-rewards .reward {
    text-align: center;
    font-size: 11px;
  }

  .channel-rewards .reward-inner {
    height: 100px;
    width: 100px;
    border-radius: 4px;
    background: #aa70ff;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 0.33rem;
    transition: transform 0.1s ease-in-out;
    flex-direction: column;
  }

  .channel-rewards .reward-inner canvas {
    margin-top: 1rem;
  }

  .channel-rewards .reward-price {
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.35);
    height: 1.3rem;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    margin-top: 1rem;
    color: #fff;
  }

  .channel-rewards .reward-price svg {
    margin-right: 3px;
    fill: #fff;
  }

  .channel-rewards .reward-inner:hover {
    transform: scale(1.05);
  }
`;
