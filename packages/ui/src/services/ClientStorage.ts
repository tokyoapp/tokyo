export class ClientStorage {
  constructor() {
    this.init();
  }

  #tmpHandle!: FileSystemDirectoryHandle;

  async init() {
    this.#tmpHandle = await this.getTemp();
  }

  async getTemp() {
    const dir = await navigator.storage.getDirectory();
    const tmp = await dir.getDirectoryHandle('tmp', {
      create: true,
    });
    return tmp;
  }

  async writeTemp(name: string, data: FileSystemWriteChunkType) {
    const tmp = this.#tmpHandle;
    const file = await tmp.getFileHandle(name, {
      create: true,
    });
    const writer = await file.createSyncAccessHandle();
    await writer.write(data);
    await writer.flush();
    await writer.close();
  }

  async readTemp(name: string) {
    const tmp = this.#tmpHandle;
    try {
      const file = await tmp.getFileHandle(name);
      return await file.getFile();
    } catch (err) {
      return;
    }
  }

  async reset() {
    const dir = await navigator.storage.getDirectory();
    await dir.removeEntry('tmp', { recursive: true });
  }

  async listTemp() {
    const tmp = this.#tmpHandle;
    const files = [];
    for await (const [key, value] of tmp.entries()) {
      files.push(key);
    }
    console.log(files);
  }
}

