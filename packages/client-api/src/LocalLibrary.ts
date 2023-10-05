/// <reference lib="webworker" />
import { index, list, system, metadata } from 'tauri-plugin-library-api';

export class LocalLibrary {
  indexListeners = new Set<(arg: library.Message) => void>();
  listListeners = new Set<(arg: library.Message) => void>();
  metadataListeners = new Set<(arg: library.Message) => void>();
  imageListeners = new Set<(arg: library.Message) => void>();
  systemListener = new Set<(arg: library.Message) => void>();
  errorListeners = new Set<(arg: Error) => void>();

  public onIndex(callback: (arg: library.Message) => void) {
    this.indexListeners.add(callback);
    return () => this.indexListeners.delete(callback);
  }

  public requestIndex(name: string) {}

  public onList(callback: (arg: library.Message) => void) {
    this.listListeners.add(callback);
    return () => this.listListeners.delete(callback);
  }

  public requestLocations() {
    list()
      .then((message) => {
        this.listListeners.forEach((cb) => cb(message));
      })
      .catch((err) => {
        console.error('error', err);
      });
  }

  public onMetadata(callback: (arg: library.Message) => void) {
    this.metadataListeners.add(callback);
    return () => this.metadataListeners.delete(callback);
  }

  public onImage(callback: (arg: library.Message) => void) {
    this.imageListeners.add(callback);
    return () => this.imageListeners.delete(callback);
  }

  public onError(callback: (arg: Error) => void) {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  public onSystem(callback: (arg: library.Message) => void) {
    this.systemListener.add(callback);
    return () => this.systemListener.delete(callback);
  }

  async getMetadata(file: string) {
    return await metadata(file).then(async (meta) => {
      // const file = meta?.hash;
      // const thumbnail = meta?.thumbnail;
      // if (file && thumbnail) {
      //   const blob = new Blob([new Uint8Array(thumbnail)]);
      // }

      return {
        metadata: meta,
      };
    });
  }

  async postMetadata(
    file: string,
    metadata: {
      rating?: number;
      tags?: string[];
    }
  ) {}

  async postLocation() {}

  async getSystem() {
    return system()
      .then((info) => {
        return info;
      })
      .catch((err) => {
        console.error('error', err);
      });
  }

  async getIndex(name: string) {
    return index(name)
      .then((index) => {
        const loc = {
          host: 'files',
          name: name,
          path: '/',
          index: index,
        };
        return loc;
      })
      .catch((err) => {
        console.error('error', err);
      });
  }
}
