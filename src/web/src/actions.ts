import { startCapture } from "./actions/captureScreen";
import { handleFiles } from "./actions/handleFiles";

const actions = {
  handleFiles: handleFiles,
  captureScreen: startCapture,
};

export default class Actions {
  static run(action: string, args = []) {
    actions[action](...args);
  }
}
