
export function dragElement(ele, callback) {

    let lastEvent = null;
    let dragging = false;

    let state = null;
    let pointers = {};

    ele.addEventListener('pointerdown', e => {
        dragging = true;
        lastEvent = e;

        pointers[e.pointerId] = e;

        state = {
            button: e.button,
            x: e.x,
            y: e.y,
            delta: [ 0, 0 ],
            absolute: [ 0, 0 ],
            mousedown: true,
            mouseup: false,
            target: e.target,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            shiftKey: e.shiftKey,
            pressure: 1.0
        }

        callback(state);
    });

    window.addEventListener('pointerup', e => {
        if(dragging) {
            dragging = false;
            lastEvent = null;

            state.x = e.x;
            state.y = e.y;
            state.mousedown = false;
            state.mouseup = true;
            state.target = e.target;

            callback(state);
        }

        delete pointers[e.pointerId];
    });

    window.addEventListener('pointermove', e => {
        if(dragging && lastEvent) {

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
            
            callback(state);
        }
    });
}
