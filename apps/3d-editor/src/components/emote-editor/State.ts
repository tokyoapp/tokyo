export let stateObject = {
    source: null,
    flip: false,
    fixedRatio: true,
    ascpetRatio: 1.0,
    minResolution: [18, 18],
    origin: { x: 0, y: 0 },
    crop: [0, 0, 0, 0],
    width: 0,
    height: 0,
    scale: 1,
    rotation: 0,
}

const history = [];
let future = [];

function serializeState(state) {
    const jsonState = JSON.stringify(state);
    const json = JSON.parse(jsonState);

    if(state.source) {
        const source = state.source;
        const sourceURL = source.src;
        json.source = sourceURL;
    }

    return JSON.stringify(json);
}

function pushState(state, arr, keep = false) {

    if(arr === history && !keep) {
        future = [];
    }

    const serialzedState = serializeState(state);
    arr.unshift(serialzedState);

    if(arr.length > 50) {
        arr.pop();
    }

    saveStateToLocal();
}

function revertState(newState) {
    stateObject = JSON.parse(newState);

    const img = new Image();
    img.src = stateObject.source;
    stateObject.source = img;

    saveStateToLocal();
}

export function pushStateHistory() {
    pushState(stateObject, history);
}

export function setState(newState) {
    stateObject = newState;
}

export function saveStateToLocal() {
    const serialzedState = serializeState(stateObject);
    localStorage.setItem('save-state', serialzedState);
}

export function loadStateFromLocal() {
    let saveState = localStorage.getItem('save-state');

    if(saveState) {
        saveState = JSON.parse(saveState);

        const img = new Image();
        img.src = saveState.source;
        saveState.source = img;
    
        return saveState;
    }
}

export function undo() {
    const oldState = history[0];

    if(oldState) {
        history.shift();
        
        pushState(stateObject, future);
        revertState(oldState);
    }
}

export function redo() {
    const newState = future[0];

    if(newState) {
        future.shift();

        pushState(stateObject, history, true);
        revertState(newState);
    }
}
