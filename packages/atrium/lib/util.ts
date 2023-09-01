interface DragState {
  button: number;
  x: number;
  y: number;
  delta: [number, number];
  absolute: [number, number];
  mousedown: Boolean;
  mouseup: Boolean;
  target: EventTarget | null;
  ctrlKey: Boolean;
  altKey: Boolean;
  shiftKey: Boolean;
  pressure: number;
  pointerId: number | null;
  type: string | null;
}

export function dragElement(ele: HTMLElement, callback: Function) {
  let lastEvent: PointerEvent | null;
  let downEvent: PointerEvent | null;
  let dragging: Boolean = false;

  let state: DragState;
  let pointers: { [key: number]: PointerEvent };

  let currPointer: number | null;

  ele.addEventListener('pointerdown', (e) => {
    pointers[e.pointerId] = e;

    if (!currPointer) {
      dragging = true;
      downEvent = e;
      currPointer = e.pointerId;
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
        pressure: 1.0,
        pointerId: null,
        type: '',
      };
    }

    callback(state);
  });

  window.addEventListener('pointerup', (e) => {
    currPointer = null;
    downEvent = null;
    lastEvent = null;

    if (dragging) {
      state.x = e.x;
      state.y = e.y;
      state.mousedown = false;
      state.mouseup = true;
      state.target = e.target;

      callback(state);
    }

    dragging = false;

    delete pointers[e.pointerId];

    console.log('pointer up');
  });

  window.addEventListener('pointermove', (e) => {
    if (e.pointerId == currPointer) {
      if (dragging && downEvent && lastEvent) {
        state.x = e.x;
        state.y = e.y;
        state.delta = [e.x - lastEvent.x, e.y - lastEvent.y];
        state.absolute = [downEvent.x - e.x, downEvent.y - e.y];
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
      lastEvent = e;
    }
  });
}
