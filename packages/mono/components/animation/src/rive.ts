import type { File } from "@rive-app/canvas-advanced-single";
import {
  Fit,
  Alignment,
  AABB,
  RiveCanvas,
  default as Rive,
} from "@rive-app/canvas-advanced-single";

export type Alignments = [Fit, Alignment, any, AABB];

const cache = new Map<string, Promise<{ file: File; rive: RiveCanvas }>>();

const rive = Rive();

export class Animations {
  static async loadCached(src: string) {
    if (!cache.has(src)) {
      cache.set(
        src,
        fetch(src).then(async (res) => {
          const file = await (await rive).load(new Uint8Array(await res.arrayBuffer()));
          return {
            rive: await rive,
            file,
          };
        })
      );
    }

    const buffer = cache.get(src);
    if (!buffer) {
      throw new Error("Source does not exist in cache.");
    }
    return buffer;
  }
}

export const registerListeners = ({
  rive,
  canvas,
  stateMachines,
  alignments,
}: {
  rive: RiveCanvas;
  canvas: HTMLCanvasElement;
  stateMachines: any[];
  alignments: Alignments;
}) => {
  if (!canvas || !stateMachines.length) {
    throw new Error("Failed to register listeners.");
  }

  const mouseCallback = (event) => {
    const boundingRect = event.currentTarget.getBoundingClientRect();

    const canvasX = event.clientX - boundingRect.left;
    const canvasY = event.clientY - boundingRect.top;
    const forwardMatrix = rive.computeAlignment(...alignments);
    const invertedMatrix = new rive.Mat2D();
    forwardMatrix.invert(invertedMatrix);
    const canvasCoordinatesVector = new rive.Vec2D(canvasX, canvasY);
    const transformedVector = rive.mapXY(invertedMatrix, canvasCoordinatesVector);
    const transformedX = transformedVector.x();
    const transformedY = transformedVector.y();

    switch (event.type) {
      // Pointer moving/hovering on the canvas
      case "mousemove": {
        for (const stateMachine of stateMachines) {
          stateMachine.pointerMove(transformedX, transformedY);
        }
        break;
      }
      // Pointer click initiated but not released yet on the canvas
      case "mousedown": {
        for (const stateMachine of stateMachines) {
          stateMachine.pointerDown(transformedX, transformedY);
        }
        break;
      }
      // Pointer click released on the canvas
      case "mouseup": {
        for (const stateMachine of stateMachines) {
          stateMachine.pointerUp(transformedX, transformedY);
        }
        break;
      }
      default:
    }
  };

  const callback = mouseCallback.bind(this);

  canvas.addEventListener("mousemove", callback);
  canvas.addEventListener("mousedown", callback);
  canvas.addEventListener("mouseup", callback);

  return () => {
    canvas.removeEventListener("mousemove", callback);
    canvas.removeEventListener("mousedown", callback);
    canvas.removeEventListener("mouseup", callback);
  };
};
