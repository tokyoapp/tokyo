import { startCapture, stopCapture } from "./actions/captureScreen";
import { handleFiles } from "./actions/handleFiles";
import { convert } from "./actions/convertToFrames";
import { saveAs } from "./actions/saveAs";

const actions = {
  handleFiles: handleFiles,
  captureScreen: startCapture,
  stopCapture: stopCapture,
  convert: convert,
  saveAs: saveAs,
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
