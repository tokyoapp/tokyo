import * as Comlink from "comlink";
import { Ifs } from "fs/interface";
import { listFiles, writeBuffer } from "./storage";

const media: any[] = [];

const fs: Ifs = {
  add(files: File[]): void {
    console.log("called add");

    for (let file of files) {
      const { name, size, type } = file;
      const blob: Blob = file;

      console.log("adding", name, blob);
      media.push(blob);
    }
  },
  async files(): Promise<Array<[string, FileSystemFileHandle]>> {
    const root = await navigator.storage.getDirectory();
    return listFiles(root);
  },
  async saveBuffer(buffer: ArrayBuffer): Promise<string> {
    return writeBuffer(buffer);
  },
};

Comlink.expose(fs);
