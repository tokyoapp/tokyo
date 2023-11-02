//

type ActionOptions = {
  icon: string;
  title: string;
  description: string;
};

type ActionFunction = (...args: Array<any>) => Promise<void>;

export class ActionsRegistry {
  static #actions = new Map<ActionOptions, ActionFunction>();

  static register(options: ActionOptions, action: ActionFunction) {
    this.#actions.set(options, action);
  }

  static find(string: string) {
    return [...this.#actions.keys()].find((opt) => opt.title.match(string));
  }

  static run(options: ActionOptions, args: Parameters<ActionFunction>) {
    const action = this.#actions.get(options);
    if (action) {
      action(...args);
    }
  }
}

//

() => {
  ActionsRegistry.register(
    {
      icon: "bin",
      title: "Delete",
      description: "Deletes current selection",
    },
    async (value: number) => {
      console.log(value);
    }
  );

  const act = ActionsRegistry.find("Delete");
  if (act) ActionsRegistry.run(act, ["test"]);
};
