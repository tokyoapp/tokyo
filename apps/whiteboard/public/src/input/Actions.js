const pointers = {};

let lastEvent = null;
let dragging = false;
let state = null;
let keysdown = {};

/**
 * Handles keyevents and registers keybinds
 */
export class Action {
    /**
     * Load JSON keymap
     *
     * @param {object} keymap key value map for keybinds
     */
    static loadActionMap(mapObject) {
        Action.keymap = mapObject;
    }

    /**
     * Returns current keymap
     */
    static getMap() {
        return Action.keymap;
    }

    /**
     * Adds a keybind to the keymap
     *
     * @param {string} action string of the action
     * @param {string} shortcut string of the shortcut
     */
    static mapShortcut(action, shortcut) {
        Action.keymap[action] = shortcut;
    }

    /**
     * Removes a keybind from the keymap
     *
     * @param {string} action string of the action
     * @param {string} shortcut string of the shortcut
     */
    static unmapShortcut(action, shortcut) {
        delete Action.keymap[action];
    }

    /**
     * Register a action
     *
     * @param {object} options action options
     */
    static register({
        onAction = () => { },
        name,
        description,
        shortcut,
        onkeydown,
        hold,
    }) {
        const action = new Action({
            onAction,
            name,
            description,
            shortcut,
            onkeydown,
            hold,
        });

        if (shortcut) {
            this.mapShortcut(name, shortcut);
        }

        Action.actions.set(name, action);

        return action;
    }

    /**
     * Unregister a action
     *
     * @param {string} name action name
     */
    static unregister(name) {
        Action.actions.delete(name);
    }

    /**
     * Listen to an action
     *
     * @param {string} name action name
     * @param {function} callback function to execute on action
     */
    static on(name, listenerFunction) {
        const action = Action.actions.get(name);

        if (action != null) {
            action.listeners.add(listenerFunction);
        }
    }

    /**
     * Axecute action
     *
     * @param {string} name action name
     * @param {array} arguments array of action arguments
     */
    static execute(name, args, event) {
        const action = Action.actions.get(name);

        if (action != null) {
            return action.execute(args, event);
        }
    }

    /**
     * Capture input key/button/axis
     */
    static captureInput() {
        return new Promise(resolve => {

            const cancel = () => {
                window.removeEventListener('keydown', handleKeypress);
                clearInterval(gamepadInterval);
            }

            const gamepadInterval = setInterval(() => {
                for (let gamepad of navigator.getGamepads()) {
                    if (gamepad) {
                        for (let btn of gamepad.buttons) {
                            if (btn.pressed) {
                                cancel();
                                resolve(`Button${gamepad.buttons.indexOf(btn)}`);
                            }
                        }
                        for (let axis of gamepad.axes) {
                            if (axis) {
                                cancel();
                                resolve(`Axis${gamepad.axes.indexOf(axis)}`);
                            }
                        }
                    }
                }
            }, 100);

            let shift = false;
            let ctrl = false;
            let alt = false;

            const handleKeypress = e => {
                e.preventDefault();

                if (e.key == "Alt") {
                    alt = true;
                } else if (e.key == "Control") {
                    ctrl = true;
                } else if (e.key == "Shift") {
                    shift = true;
                } else {
                    const key = e.key.toLocaleUpperCase();
                    resolve(`${ctrl ? 'Ctrl+' : ''}${shift ? 'Shift+' : ''}${shift ? 'Shift+' : ''}${key}`);
                }

                cancel();
            }

            window.addEventListener('keydown', handleKeypress);
        });
    }

    /**
     * Handle key event from key down and up event
     */
    static handleKey(event, keydown) {
        // cancel if inside input element
        // if (document.activeElement.tabIndex === 0) {
        //     return;
        // }

        const action = this.getActionForShortcut(event);

        if (action) {
            // prevent default for a mapped shortcut or ctr+* shortcut
            const actionInstance = Action.get(action);
            if (actionInstance) {
                const prevState = actionInstance.state;
                actionInstance.state = keydown ? 1 : 0;

                if (actionInstance.hold) {
                    if (keydown && prevState === 0 || !keydown) {
                        actionInstance.execute(null, event);
                    }
                } else {
                    if (keydown && actionInstance.onkeydown) {
                        if (prevState === 0) {
                            actionInstance.execute(null, event);
                        }
                    } else if (!keydown && !actionInstance.onkeydown) {
                        actionInstance.execute(null, event);
                    }
                }
            }
        }
    }

    /**
     * Get all gamepads from navigator
     *
     * @returns {Array} array of gamepads
     */
    static getGamepads() {
        return navigator.getGamepads();
    }

    /**
     * Get gamepad by index
     *
     * @returns {Gamepad} gamepad
     */
    static getGamepad(index) {
        const gamepads = this.getGamepads();
        return gamepads[index];
    }

    /**
     * Get all gamepads from navigator
     *
     * @param {Event} event Gamepad connection event
     * @param {Boolean} arguments Connected or disconnected
     *
     * @returns {Array} array of gamepads
     */
    static handleGamepad(e, connected) {
        const gamepad = e.gamepad;

        if (connected) {
            // gamepad connected
            if (gamepad.vibrationActuator) {
                gamepad.vibrationActuator.playEffect("dual-rumble", {
                    startDelay: 0,
                    duration: 20,
                    weakMagnitude: .2,
                    strongMagnitude: .2
                });
            }
        } else {
            // gamepad disconnected
        }
    }

    /**
     * Check gamepad state and execute action bindings
     */
    static checkGamepadInput() {
        const gamepads = this.getGamepads();

        this.gamepads = gamepads;

        for (let gamepad of this.gamepads) {
            if (!gamepad) continue;

            // axes
            const axes = gamepad.axes;

            let axisIndex = -1;

            for (let axis of axes) {
                axisIndex++;

                const id = 'Axis' + axisIndex;
                const action = this.getActionForButton(id);

                if (action) {
                    const actionInstance = Action.get(action);
                    if (actionInstance) {
                        if (actionInstance.gamepad == -1) {
                            actionInstance.setGamepad(gamepad.index);
                        }

                        if (actionInstance.gamepad == gamepad.index) {
                            actionInstance.update(axis);
                        }
                    }
                }
            }

            // buttons
            const buttons = gamepad.buttons;

            for (let button of buttons) {
                const id = 'Button' + buttons.indexOf(button);
                const action = this.getActionForButton(id);

                if (action) {
                    const actionInstance = Action.get(action);
                    if (actionInstance) {
                        if (actionInstance.gamepad == -1) {
                            actionInstance.setGamepad(gamepad.index);
                        }

                        if (actionInstance.state !== button.value &&
                            actionInstance.gamepad == gamepad.index) {

                            if (button.value) {
                                actionInstance.press();
                            } else {
                                actionInstance.release();
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Start update input loop
     */
    static inputLoop() {
        this.checkGamepadInput();

        requestAnimationFrame(this.inputLoop.bind(this));
    }

    /**
     * Get action
     *
     * @param {string} name action name
     */
    static get(actionName) {
        return Action.actions.get(actionName);
    }

    /**
     * Get action by gamepad button id
     *
     * @param {String} buttonId button id
     */
    static getActionForButton(buttonId) {
        const map = Action.getMap();

        actionsLoop: for (let action in map) {
            if (!(action in map)) continue;

            const shortcut = map[action];

            if (shortcut !== buttonId) {
                continue actionsLoop;
            }

            return action;
        }
    }

    /**
     * Get action by event
     *
     * @param {Event} event event
     */
    static getActionForShortcut(event) {
        const pressed = {
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            alt: event.altKey
        };

        if(event.type.match('key')) {
            pressed[event.key.toLocaleLowerCase()] = true;
            pressed[event.code.toLocaleLowerCase()] = true;
        } else {
            const mbtn = state.button;
            if(mbtn !== -1) {
                pressed["mouse" + (mbtn + 1)] = true;
            }

            if(state.pinching) {
                pressed["pinch"] = true;
            }
            if(state.panning) {
                pressed["pan"] = true;
            }
        }

        const map = Action.getMap();

        actionsLoop: for (let action in map) {
            if (!(action in map)) continue;

            const mappedShortcut = {
                ctrl: false,
                shift: false,
                alt: false
            };

            // populate mappedShortcut object
            const shortcut = map[action];
            const keys = shortcut.toLocaleLowerCase().split("+");

            for (let k of keys) {
                const lowerKey = k.toLocaleLowerCase();

                switch (lowerKey) {
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
                        mappedShortcut[lowerKey] = true;
                }
            }

            // check if pressed matches with mapped shortcuut
            for (let key in mappedShortcut) {
                if (pressed[key] !== mappedShortcut[key]) 
                    continue actionsLoop;
            }

            return action;
        }
    }

    /**
     *  Handle Poniter Input Event
     * 
     * @param {Event} event pointer event
    */
    static handlePointerInput(e) {
        switch (e.type) {
            case "pointerdown":
                dragging = true;
                lastEvent = e;

                pointers[e.pointerId] = e;

                state = {
                    button: e.button,
                    x: e.x,
                    y: e.y,
                    delta: [0, 0],
                    absolute: [0, 0],
                    mousedown: true,
                    mouseup: false,
                    target: e.target,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey,
                    shiftKey: e.shiftKey,
                    lastDisntace: null,
                    pinching: false,
                    panning: false,
                    pressure: 1.0
                }
                break;
            case "pointerup":
                if (dragging) {
                    dragging = false;
                    lastEvent = null;

                    state.x = e.x;
                    state.y = e.y;
                    state.mousedown = false;
                    state.mouseup = true;
                    state.target = e.target;
                }

                delete pointers[e.pointerId];
                break;
            case "pointermove":
                pointers[e.pointerId] = e;

                const keys = Object.keys(pointers);
                if(keys.length > 1) {
                    const pointer1 = pointers[keys[0]];
                    const pointer2 = pointers[keys[1]];

                    const p1 = [pointer1.x, pointer1.y];
                    const p2 = [pointer2.x, pointer2.y];

                    // pinch
                    const distance = Math.sqrt(
                        Math.pow(p2[0] - p1[0], 2) +
                        Math.pow(p2[1] - p1[1], 2)
                    );

                    if(state.initialDistnace == null) {
                        state.initialDistnace = distance;
                    }
                    
                    if(state.lastDisntace) {
                        state.pinch = distance - state.lastDisntace;
                    }
                    if(Math.abs(state.initialDistnace - distance) > 100) {
                        state.pinching = true;
                    }

                    state.lastDisntace = distance;

                    // pan
                    if(Math.abs(state.absolute[0]) > 50 || Math.abs(state.absolute[1]) > 50) {
                        state.panning = true;
                    }
                }
                
                if (dragging && lastEvent) {

                    state.x = e.x;
                    state.y = e.y;
                    state.delta = [
                        e.movementX,
                        e.movementY
                    ];
                    state.absolute = [
                        lastEvent.x - e.x,
                        lastEvent.y - e.y
                    ];
                    state.mousedown = false;
                    state.mouseup = false;
                    state.target = e.target;
                    state.ctrlKey = e.ctrlKey;
                    state.altKey = e.altKey;
                    state.shiftKey = e.shiftKey;
                    state.pressure = e.pressure;
                    state.type = e.pointerType;
                    state.pointerId = e.pointerId;

                    if(event.pointerId == Object.keys(pointers)[0]) {
                        const action = this.getActionForShortcut(event);

                        if (action) {
                            // prevent default for a mapped shortcut or ctr+* shortcut
                            const actionInstance = Action.get(action);
                            if (actionInstance) {
                                actionInstance.update(state);
                            }
                        }
                    }
                }
                break;
        }
    }

    /**
     * Action
     *
     * @param {object} options action options
     */
    constructor({
        name,
        description,
        onAction,
        onkeydown = true,
        hold
    }) {
        this.name = name;
        this.description = description;
        this.action = onAction;
        this.listeners = new Set();
        this.onkeydown = onkeydown;
        this.state = 0;
        this.gamepad = -1;
        this.toggleValue = false;
        this.hold = hold;
    }

    /**
     * Execute the action
     *
     * @param {array} arguments array of action arguments
     */
    execute(args, event) {
        if (this.action instanceof Function) {

            this.toggleValue = !this.toggleValue;

            for (let listener of this.listeners) {
                listener(args);
            }

            return this.action(args, event, this);
        }
    }

    setGamepad(index) {
        this.gamepad = index;
    }

    update(state) {
        this.state = state;
        this.execute();
    }

    press() {
        this.state = 1;
        this.execute();
    }

    release() {
        this.state = 0;
        this.execute();
    }
}

Action.actions = new Map();
Action.keymap = {};
Action.runInputLoop = true;

window.addEventListener('load', e => (Action.runInputLoop ? Action.inputLoop() : null));

window.addEventListener("keydown", e => Action.handleKey(e, true));
window.addEventListener("keyup", e => Action.handleKey(e, false));

window.addEventListener('gamepadconnected', e => Action.handleGamepad(e, true));
window.addEventListener('gamepaddisconnected', e => Action.handleGamepad(e, false));

window.addEventListener('pointerdown', e => Action.handlePointerInput(e, true));
window.addEventListener('pointerup', e => Action.handlePointerInput(e, true));
window.addEventListener('pointermove', e => Action.handlePointerInput(e, true));
