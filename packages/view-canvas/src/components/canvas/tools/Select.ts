import Tool from "./Tool";

export default class Select extends Tool {
  static onMouseDown(cnvs, data) {
    // mbtn 0 mousedown
    // interact with nodes
    // SELECT TOOL

    const node = cnvs.hitTestNode(data.x, data.y);
    if (node) {
      cnvs.pointer.onNode = true;
      cnvs.addSelection(node);
    } else {
      cnvs.selection = [];
      cnvs.pointer.onNode = false;
    }
    cnvs.pointer.scaling = cnvs.pointer.scaleCorner;
    cnvs.pointer.selection[0] = [data.x, data.y];
    cnvs.pointer.selection[1] = [data.x, data.y];

    if (cnvs.pointer.focusedElement != node) {
      cnvs.pointer.focusedElement = node;
    }
  }

  static onMouseUp(cnvs, data) {
    this.onMouseUse(cnvs, data);

    // SELECT TOOL
    cnvs.pointer.selecting = false;
    cnvs.pointer.selection = [
      [0, 0],
      [0, 0],
    ];
    // apply selection rect

    cnvs.lastLastSelection = [...cnvs.selection];
    if (cnvs.pointer.onNode) {
      cnvs.selection = [];
    }
  }

  static onMouseDrag(cnvs, data) {
    this.onMouseUse(cnvs, data);
  }

  static onMouseUse(cnvs, data) {
    // mbtn 0
    // mbtn 0 mouseup or dragging
    // interact with nodes and selection
    // SELECT TOOL

    if (cnvs.pointer.scaling && cnvs.selection.length > 0) {
      const node = cnvs.pointer.focusedElement;
      const ar = node.size[0] / node.size[1];
      const stepX = data.delta[0] / cnvs.currentScale;
      const stepY = data.delta[1] / cnvs.currentScale;

      let wStep = stepX;
      let hStep = stepX / ar;

      if (cnvs.canvas.getNodeElement(node).type == "text/plain") {
        if (node.size[0] > 100 && node.size[0] > 100) {
          node.size[0] += stepX;
          node.size[1] += stepY;
        }
      } else {
        if (wStep < 0 && node.size[0] > 100) {
          node.size[0] += wStep;
          node.size[1] += hStep;
        } else if (wStep > 0) {
          node.size[0] += wStep;
          node.size[1] += hStep;
        }
      }
    } else if (cnvs.pointer.onNode) {
      for (let node of cnvs.selection) {
        node.position[0] += data.delta[0] / cnvs.currentScale;
        node.position[1] += data.delta[1] / cnvs.currentScale;
      }
    } else {
      cnvs.pointer.selecting = true;
      cnvs.pointer.selection[1] = [data.x, data.y];
      cnvs.evaluatePointerSelection();
    }
  }
}
