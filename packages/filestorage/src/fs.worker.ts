import { listFiles, writeBuffer, writeFile } from "./storage";

export default {
  async add(files: File[]) {
    for (let file of files) {
      const { name, size, type } = file;
      await writeFile(name, file);
    }
  },

  async readHeader(fileName: string): Promise<string | undefined> {
    const files = await this.files();
    for (let file of files) {
      if (file.name === fileName) {
        return file.slice(0, 256).text();
      }
    }
  },

  async files(): Promise<Array<[string, FileSystemFileHandle]>> {
    const root = await navigator.storage.getDirectory();
    return listFiles(root);
  },

  async list() {
    return this.files();
  },

  async saveBuffer(buffer: ArrayBuffer): Promise<string> {
    return writeBuffer(buffer);
  },

  async clear() {
    const root = await navigator.storage.getDirectory();
    const files = await listFiles(root);
    for (let [name, file] of files) {
      await root.removeEntry(name);
    }
  },

  async get(fileName: string) {
    const files = await this.files();
    for (let [name, file] of files) {
      if (name === fileName) return file;
    }
  },

  async test() {
    console.log(this);
  },
};
