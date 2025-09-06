//

type ActionOptions = {
  title?: string;
  icon?: string;
  description?: string;
  group?: string;
  run: () => Promise<void>;
};

interface PressedKeysMap {
  [key: string]: boolean;
}

const globalActions = new Map<string, ActionOptions>();
const globalShortcuts = new Map<string, Set<string>>();

const actionHistory: string[] = [];

export class Actions {
  /**
   * Actions history
   * @returns {string[]} List of action ids. Most recent first.
   */
  static history() {
    // to calc how often a action is used to rank in command palette
    return actionHistory;
  }

  static rank(id: string, search: string): number {
    const action = Actions.get(id);
    if (action?.title?.toLocaleLowerCase().includes(search.toLocaleLowerCase())) {
      return 2;
    }
    if (action?.description?.toLocaleLowerCase().includes(search.toLocaleLowerCase())) {
      return 1;
    }
    return 0;
  }

  static entries() {
    return globalActions.entries();
  }

  static register(id: string, options: ActionOptions) {
    globalActions.set(id.toLocaleLowerCase(), options);
  }

  static unregister(idOrAction: string | ActionOptions) {
    if (typeof idOrAction === "string") {
      globalActions.delete(idOrAction);
    } else if (typeof idOrAction === "object") {
      for (const [id, action] of globalActions) {
        if (action === idOrAction) {
          globalActions.delete(id);
        }
      }
    }
  }

  static get(actionId: string) {
    return globalActions.get(actionId);
  }

  static run(id: string) {
    const action = Actions.get(id);
    if (action) {
      action.run();
      actionHistory.unshift(id);
    } else {
      throw new Error(`Action with id '${id}', not found.`);
    }
  }

  static groups() {
    const groups = new Set<string>();
    for (const [id, action] of globalActions) {
      if (action.group) groups.add(action.group);
      else groups.add("other");
    }
    return [...groups].sort((a, b) => {
      if (a === "cities") {
        return -1;
      }
      return 0;
    });
  }

  static group(groupId: string) {
    const actions = new Set<[string, ActionOptions]>();
    for (const [id, action] of globalActions) {
      if ((action.group || "other") === groupId) actions.add([id, action]);
    }
    return [...actions];
  }

  /**
   * Adds a keybind to the keymap
   * @param {string} shortcut string of the shortcut
   * @param {string} actionId string of the action
   */
  static mapShortcut(shortcut: string, actionId: string) {
    const shortcuts = globalShortcuts.get(actionId);
    if (shortcuts) {
      shortcuts.add(shortcut);
    } else {
      globalShortcuts.set(actionId, new Set([shortcut]));
    }
  }

  /**
   * Removes a keybind from the keymap
   * @param {string} shortcut string of the shortcut
   * @param {string} actionId string of the action
   */
  static unmapShortcut(shortcut: string, actionId: string) {
    const shortcuts = globalShortcuts.get(actionId);
    if (shortcuts) {
      shortcuts.delete(shortcut);
      if (shortcuts.size === 0) {
        globalShortcuts.delete(actionId);
      }
    }
  }

  /**
   * Handle key event from key down and up event
   */
  static handleKey(event: KeyboardEvent, keydown: boolean | undefined) {
    // cancel if inside specified element
    const ignoredElements = ["INPUT"];

    const activeNodeName = document.activeElement?.nodeName;
    if (activeNodeName && ignoredElements.includes(activeNodeName)) {
      return;
    }

    const action = Actions.getActionForShortcut(event);
    if (action) {
      Actions.run(action);
    }
  }

  /**
   * Get shortcuts by action
   * @param {string} actionId Action ID
   */
  static getShortcutsForAction(actionId: string) {
    return globalShortcuts.get(actionId);
  }

  /**
   * Get action by event
   * @param {Event} event event
   */
  static getActionForShortcut(event: KeyboardEvent | PointerEvent) {
    const pressed: PressedKeysMap = {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
    };

    if (event instanceof KeyboardEvent) {
      pressed[event.key.toLocaleLowerCase()] = true;
      pressed[event.code.toLocaleLowerCase()] = true;
    }

    actionsLoop: for (const [actionId, shortcuts] of globalShortcuts) {
      for (const shortcut of shortcuts) {
        const mappedShortcut: PressedKeysMap = {
          ctrl: false,
          shift: false,
          alt: false,
        };

        const keys = shortcut.toLocaleLowerCase().split("+");
        for (const key of keys) {
          switch (key) {
            case "ctrl":
              mappedShortcut.ctrl = true;
              break;
            case "shift":
              mappedShortcut.shift = true;
              break;
            case "alt":
              mappedShortcut.alt = true;
              break;
            default:
              mappedShortcut[key] = true;
          }
        }

        // check if pressed matches with mapped shortcuut
        for (const key in mappedShortcut) {
          if (pressed[key] !== mappedShortcut[key]) continue actionsLoop;
        }

        return actionId;
      }
    }
  }
}

// window.addEventListener('keydown', (e) => Actions.handleKey(e, true));
window.addEventListener("keyup", (e) => Actions.handleKey(e, false));
