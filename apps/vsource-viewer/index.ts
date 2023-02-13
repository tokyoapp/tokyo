import "atrium/lib/main";

// index.js
// import { html } from "lit-element";
// import settings from './src/settings';
import actions from "./src/actions";
import "./src/components/viewport/Viewport";
import "tree-explorer/components/tree-explorer";
import "./src/components/outliner/Outliner";

import { Action } from "atrium/lib/Actions";

for (const actn of actions) {
  Action.register(actn);
}
