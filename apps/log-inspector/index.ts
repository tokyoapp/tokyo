import "atrium/lib/main";

// index.js
// import { html } from "lit-element";
// import settings from './src/settings';
import actions from "./src/actions";
import "ui/components/tree-explorer";

import { Action } from "atrium/lib/Actions";

for (const actn of actions) {
  Action.register(actn);
}
