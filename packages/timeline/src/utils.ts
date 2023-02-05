window.globalThis = window.globalThis || window;

window.createHTMLElement = (node, json) => {
  const root = document.createElement(node);
  const atributes = Object.keys(json);
  for (let atr of atributes) {
    root[atr] = json[atr];
  }
  return root;
};

export function isMouseButton(e) {
  let mbutton;
  if (e.button != null) {
    if (e.buttons == 4) {
      mbutton = 2;
    } else {
      mbutton = e.buttons;
    }
  } else {
    mbutton = e.which;
  }
  return mbutton;
}

export function isImageObject(source) {
  return (
    source instanceof ImageBitmap ||
    source instanceof HTMLImageElement ||
    source instanceof HTMLCanvasElement ||
    source instanceof HTMLVideoElement ||
    source instanceof HTMLMediaElement
  );
}

export function bezier3(t, P1, P2, P3) {
  return [
    Math.pow(1 - t, 2) * P1[0] +
      2 * (1 - t) * t * P2[0] +
      Math.pow(t, 2) * P3[0],
    Math.pow(1 - t, 2) * P1[1] +
      2 * (1 - t) * t * P2[1] +
      Math.pow(t, 2) * P3[1],
  ];
}

export function bezier4(t, P1, P2, P3, P4) {
  return [
    Math.pow(1 - t, 3) * P1[0] +
      3 * Math.pow(1 - t, 2) * t * P2[0] +
      3 * Math.pow((1 - t) * t, 2) * P3[0] +
      Math.pow(t, 3) * P4[0],
    Math.pow(1 - t, 3) * P1[1] +
      3 * Math.pow(1 - t, 2) * t * P2[1] +
      3 * Math.pow((1 - t) * t, 2) * P3[1] +
      Math.pow(t, 3) * P4[1],
  ];
}

export function dragElement(ele, callback) {
  let lastEvent = null;
  let dragging = false;

  let state = null;

  ele.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastEvent = e;

    state = {
      x: e.x,
      y: e.y,
      delta: [0, 0],
      absolute: [0, 0],
      mousedown: true,
      mouseup: false,
      target: e.target,
    };

    callback(state);
  });

  window.addEventListener("pointerup", (e) => {
    if (dragging) {
      dragging = false;
      lastEvent = null;

      state.x = e.x;
      state.y = e.y;
      state.mousedown = false;
      state.mouseup = true;
      state.target = e.target;

      callback(state);
    }
  });

  window.addEventListener("pointermove", (e) => {
    if (dragging && lastEvent) {
      state.x = e.x;
      state.y = e.y;
      state.delta = [e.movementX, e.movementY];
      state.absolute = [lastEvent.x - e.x, lastEvent.y - e.y];
      state.mousedown = false;
      state.mouseup = false;
      state.target = e.target;

      callback(state);
    }
  });
}

let cursorStyle = null;

export function setCursor(cursorType) {
  if (!cursorStyle) {
    cursorStyle = document.createElement("style");
    document.head.appendChild(cursorStyle);
  }
  cursorStyle.innerHTML = `body { cursor: ${cursorType} !important; }`;
}

export function clearCursor() {
  if (cursorStyle) {
    cursorStyle.innerHTML = ``;
  }
}
