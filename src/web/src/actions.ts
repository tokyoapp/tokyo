import { startCapture, stopCapture } from "./actions/captureScreen";
import { handleFiles } from "./actions/handleFiles";
import { convert } from "./actions/convertToFrames";

const actions = {
  handleFiles: handleFiles,
  captureScreen: startCapture,
  stopCapture: stopCapture,
  convert: convert,
};

export default class Actions {
  static run(action: string, args = []) {
    if (actions[action]) {
      actions[action](...args);
    } else {
      throw new Error(`Action not found: ${action}`);
    }
  }
}
