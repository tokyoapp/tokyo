import init, { load_webp, InitOutput } from "webp/pkg/webp";

let worker: InitOutput | null = null;

export default class WebP {
  static async creatWorker() {
    worker = await init();
  }

  static async load(buffer: Uint8Array) {
    if (!worker) await this.creatWorker();
    load_webp(buffer);
  }
}
