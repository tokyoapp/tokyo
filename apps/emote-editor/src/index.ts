// index.js

import menu from "./menu";
import settings from "./settings";
import actions from "./actions";
import TwitchChat from "ui/components/chat/TwitchChat";
import EmoteEditorEle from "./components/emote-editor/EmoteEditor";
import "ui/components/THColorPicker";

import atrium from "atrium";

export default class EmoteEditor {
  static title = "Emote Editor";
  static components = [TwitchChat, EmoteEditorEle];

  static menu = menu;
  static settings = settings;
  static actions = actions;
}

import StartComponent from "ui/components/start/Start";

atrium([
  EmoteEditor,
  {
    name: "Start",
    components: [StartComponent],
  },
]);
