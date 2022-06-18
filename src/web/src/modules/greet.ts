import init, { greet, InitOutput } from "hello-wasm/pkg/hello_wasm";

let worker: InitOutput | null = null;

export default class Greet {
  static async creatWorker() {
    worker = await init();
  }

  static async greet(string: string) {
    if (!worker) await this.creatWorker();

    greet(string);
  }
}
