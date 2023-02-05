import { startCapture, stopCapture } from "./captureScreen";
import { handleFiles } from "./handleFiles";
import { convert } from "./convertToFrames";
import { saveAs } from "./saveAs";

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
      return actions[action](...args);
    } else {
      throw new Error(`Action not found: ${action}`);
    }
  }
}
