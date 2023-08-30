import reload from "./reload.ts";

export default class Action {
  static actions: Record<string, () => void> = {
    reload: reload,
  };

  static map(action: string) {
    return () => {
      if (action in this.actions) this.actions[action]();
    };
  }
}
