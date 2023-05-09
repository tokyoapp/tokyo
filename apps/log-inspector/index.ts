import "atrium/lib/main";
import { actions } from "./src/client.js";
import "ui/components/tree-explorer";

import { Action } from "atrium/lib/Actions";

for (const actn of actions) {
  Action.register(actn);
}
