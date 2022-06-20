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

    this.list();
  }

  static async list() {
    if (!thread) throw new Error("fs thread not initialized!");
    const files = await thread.files();
    console.log("WE GOT DEM FILES YP", files);
    return files;
  }
}
