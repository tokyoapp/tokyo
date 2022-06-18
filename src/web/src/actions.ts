import handleFiles from "./actions/handleFiles";

const actions = {
  handleFiles: handleFiles,
};

export default class Actions {
  static run(action: string, args) {
    actions[action](...args);
  }
}
