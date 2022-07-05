import { Media } from "./storage/Media";
import * as Comlink from "comlink";
import { Ifs } from "fs/interface";

let thread: Comlink.Remote<Ifs> | null = null;

async function init() {
  const worker = new Worker(
    new URL("../../../../packages/fs/fs.ts", import.meta.url),
    { type: "module" }
  );
  thread = Comlink.wrap(worker);
  console.log(thread);
}

init();

export default class fs {
  static async add(files: File[]) {
    if (!thread) throw new Error("fs thread not initialized!");
    await thread.add(files);
    return true;
  }

  static async get(fileName: string) {
    if (!thread) throw new Error("fs thread not initialized!");

    const files = await thread.files();
    for (let [name, file] of files) {
      if (name === fileName) return file;
    }
  }

  static async list() {
    if (!thread) throw new Error("fs thread not initialized!");
    return await thread.files();
  }

  static async saveBuffer(buffer: ArrayBuffer): Promise<string> {
    if (!thread) throw new Error("fs thread not initialized!");
    return await thread.saveBuffer(buffer);
  }
}
