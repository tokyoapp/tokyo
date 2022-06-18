import init, { load_exr, InitOutput } from "exr/pkg/exr";

let worker: InitOutput | null = null;

export default class EXR {
  static async creatWorker() {
    worker = await init();
  }

  static async load(buffer: Uint8Array) {
    if (!worker) await this.creatWorker();
    load_exr(buffer);
  }
}
