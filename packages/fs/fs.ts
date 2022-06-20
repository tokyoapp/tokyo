import * as Comlink from "comlink";
import { Ifs } from "fs/interface";

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
  files(): File[] {
    return media;
  },
};

Comlink.expose(fs);
