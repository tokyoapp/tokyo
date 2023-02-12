import Tool from "./Tool.js";

function pointInCircle(p1, p2, r) {
    return Math.sqrt(
        Math.pow(p2[0] - p1[0], 2) +
        Math.pow(p2[1] - p1[1], 2)
    ) <= r;
}

export default class Pen extends Tool {

    static onMouseDown(cnvs, data) {
        // mbtn 0 mousedown
        // draw line with pen
        // PEN TOOL
        cnvs.canvas.lines.unshift([]);
    }

    static onMouseUp(cnvs, data) {
        // nothing
        this.onMouseUse(cnvs, data);
        cnvs.canvas.pushToHistory();
    }

    static onMouseDrag(cnvs, data) {
        this.onMouseUse(cnvs, data);
    }

    static onMouseUse(cnvs, data) {
        // mbtn 0 mouseup or dragging
        // draw with pen
        // PEN TOOL
        if(data.shiftKey) {
            for(let line of cnvs.canvas.lines) {
                for(let point of [...line]) {
                    if(pointInCircle(point, [cnvs.pointer.canvasX, cnvs.pointer.canvasY], cnvs.pointer.brushSize / cnvs.currentScale)) {
                        line.splice(line.indexOf(point), 1);
                    }
                }
            }
        } else {
            cnvs.canvas.lines[0].push(
                cnvs.viewToCanvas(data.x, data.y)
            );
        }
    }

}