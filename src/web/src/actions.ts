import { startCapture, stopCapture } from "./actions/captureScreen";
import { handleFiles } from "./actions/handleFiles";

const actions = {
  handleFiles: handleFiles,
  captureScreen: startCapture,
  stopCapture: stopCapture,
};

export default class Actions {
  static run(action: string, args = []) {
    actions[action](...args);
  }
}
