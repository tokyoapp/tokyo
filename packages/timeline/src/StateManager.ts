import { createStore } from "redux";
import { Lang } from "./Lang";
import { LocalJsonStorage } from "./LocalJsonStorage";

class State {
  constructor() {
    this.lastSave = 1569326841534;
    this.time = 0;
    this.length = 5;
    this.timeoffset = 0;
    this.editor = {
      view: {
        x: 59.19354066985646,
        y: 17.498906356801072,
      },
      zoom: 0.6333333333333334,
      nodes: [],
    };
    this.layout = {};
    this.assets = [];
    this.import = [];
  }
}

const initialState = new State();

const listeners = {
  load: new Set(),
  save: new Set(),
};

/**
 * Wrapper class for the redux store
 *
 */

export class StateManager extends LocalJsonStorage {
  static get storage() {
    return "gyro-project";
  }

  /**
   * Returns the store
   */
  static getStore() {
    return globalThis.store;
  }

  /**
   * Returns current state
   */
  static getState() {
    return this.getStore().getState();
  }

  /**
   * Register load callback
   */
  static onLoadState(callback) {
    listeners.load.add(callback);

    return () => {
      listeners.load.remove(callback);
    };
  }

  /**
   * Register save callback
   */
  static onSaveState(callback) {
    listeners.save.add(callback);

    return () => {
      listeners.save.remove(callback);
    };
  }

  /**
   * Subscribe to store
   *
   * @param {function} callback callback function
   */
  static subscribe(callback) {
    let lastSave = 0;

    return this.getStore().subscribe(() => {
      let initial = false;
      const state = this.getState();

      if (lastSave != state.lastSave) {
        initial = true;
        lastSave = state.lastSave;
      }

      callback(state, initial);
    });
  }

  /**
   * Dispatch state
   *
   * @param {object} state state to dispatch
   */
  static dispatch(...args) {
    return this.getStore().dispatch(...args);
  }

  static getInitialState() {
    return Object.assign({}, initialState);
  }

  /**
   * Resets state to initial
   */
  static newSession() {
    this.loadState(initialState);
  }

  /**
   * Returns the state from localstorage
   */
  static getSavedState() {
    return this.list();
  }

  /**
   * Save state to localstorage
   */
  static saveStateToLocalStorage() {
    const state = this.getState();
    const saveState = Object.assign({}, state);
    saveState.lastSave = Date.now();

    try {
      this.store(saveState);
    } catch (err) {
      Gyro.saveToFile();
    }
  }

  /**
   * Save state
   */
  static saveState() {
    window.dispatchEvent(new Event("save"));

    for (let saveListener of listeners.save) {
      saveListener();
    }
  }

  /**
   * Load state to localstorage
   */
  static loadStateFromLocalStorage() {
    const saved = StateManager.getSavedState();
    if (saved) {
      this.loadState(saved);
    }
  }

  /**
   * Load state object
   *
   * @param {object} state state to load
   */
  static loadState(newState) {
    const state = StateManager.getState();

    if (state) {
      for (let key in newState) {
        state[key] = newState[key];
      }

      for (let loadListener of listeners.load) {
        try {
          loadListener(state);
        } catch (err) {
          console.error(err);
        }
      }

      this.dispatch({ type: "load" });

      new Notification({ text: Lang.get("notification.saveLoaded") }).show();
    }
  }

  static importState(newState) {
    const state = StateManager.getState();
    if (state) {
      state.assets.push(...newState.assets);
      state.import.push(...newState.import);
      state.timeline.push(...newState.timeline);

      for (let node of newState.editor.nodes) {
        for (let paramName in node.parameters) {
          const parameter = node.parameters[paramName];
          if (parameter && parameter.inputParameter) {
            parameter.inputParameter.input += state.editor.nodes.length;
          }
        }
      }

      state.editor.nodes.push(...newState.editor.nodes);

      document.querySelector("gyro-editor").loadState(state.editor);

      this.dispatch({ type: "load" });

      new Notification({ text: "Imported" }).show();
    }
  }
}

const actions = {
  time(state, action) {
    state.time = action.time;
  },

  playstate(state, action) {
    state.playstate = action.playstate;
  },

  length(state, action) {
    state.length = action.length;
  },

  timeoffset(state, action) {
    state.timeoffset = action.timeoffset;
  },

  editor(state, action) {
    state.editor = action.editor;
  },

  timeline(state, action) {
    state.timeline = action.timeline;
  },

  import(state, action) {
    state.import = action.import;
  },

  layout(state, action) {
    state.layout = action.layout;
  },

  assets(state, action) {
    state.assets = action.assets;
  },
};

function StateManagerReducer(state, action) {
  if (!state) state = Object.assign({}, initialState);

  if (action.type && actions[action.type]) {
    actions[action.type](state, action);
  } else if (action.type == "timeline") {
    const keys = Object.keys(action);
    for (let key of keys) {
      state[key] = action[key];
    }
  }

  return state;
}

globalThis.store = createStore(StateManagerReducer);
