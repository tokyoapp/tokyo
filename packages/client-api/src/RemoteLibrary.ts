/// <reference lib="webworker" />

import * as Comlink from 'comlink';
import * as library from 'proto';
// import { ClientStorage } from './ClientStorage.ts';

// const storage = new ClientStorage();

let msg_count = 1;

export class LibraryLocation {
  ws!: WebSocket;

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
    const msg = library.ClientMessage.create({
      id: ++msg_count,
      locations: library.RequestLocations.create({}),
    });
    const data = library.ClientMessage.encode(msg).finish();
    this.ws.send(data);
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

  private async handleMessage(message: library.Message) {
    const type =
      message.error ||
      message.image ||
      message.index ||
      message.list ||
      message.metadata ||
      message.system;

    console.log('[WS]', type);

    switch (type) {
      case message.error: {
        console.error('Error response:', message);
        this.errorListeners.forEach((cb) => cb(new Error(`Error: ${message.message}`)));
        break;
      }
      case message.index: {
        this.indexListeners.forEach((cb) => cb(message));
        break;
      }
      case message.list: {
        this.listListeners.forEach((cb) => cb(message));
        break;
      }
      case message.metadata: {
        // const file = message.metadata?.hash;
        // const thumbnail = message.metadata?.thumbnail;
        // if (file && thumbnail) {
        //   const blob = new Blob([thumbnail]);
        //   storage.writeTemp(file, await blob.arrayBuffer());
        // }

        if (message.metadata) {
          this.metadataListeners.forEach((cb) => cb(message));
        }
        break;
      }
      case message.image: {
        this.imageListeners.forEach((cb) => cb(message));
        break;
      }
      case message.system: {
        this.systemListener.forEach((cb) => cb(message));
        break;
      }
    }
  }

  postMetadata(
    file: string,
    meta: {
      rating?: number;
    }
  ) {
    const id = ++msg_count;
    const msg = library.ClientMessage.create({
      id: id,
      postmeta: library.PostFileMetadata.create({
        file: file,
        rating: meta.rating,
      }),
    });
    this.send(msg);
  }

  getMetadata(file: string) {
    const id = ++msg_count;
    const msg = library.ClientMessage.create({
      id: id,
      meta: library.RequestMetadata.create({
        file: file,
      }),
    });
    this.send(msg);

    return new Promise<library.Message>((resolve) => {
      this.onMetadata((msg) => {
        if (msg.id === id) {
          resolve(msg);
        }
      });
    });
  }

  send(msg: library.ClientMessage) {
    this.ws.send(library.ClientMessage.encode(msg).finish());
  }

  createLocation() {
    const msg = library.ClientMessage.create({
      create: library.CreateLibraryMessage.create({
        name: 'Desktop',
        path: '/Users/tihav/Desktop',
      }),
    });
    this.send(msg);
  }

  connect(host: string): Promise<void> {
    console.log('worker', host);

    return new Promise((resolve) => {
      this.ws = new WebSocket(`ws://${host}/ws`);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        resolve();
      };
      this.ws.onerror = (err) => {
        console.error('[WS] Error: ', err);
        this.errorListeners.forEach((cb) => cb(new Error(`[WS] Error: ${err}`)));
      };
      this.ws.onmessage = async (msg) => {
        console.log(msg.data.buffer);
        let buf;
        if (msg.data instanceof Blob) {
          buf = await (msg.data as Blob).arrayBuffer();
        } else {
          buf = msg.data.buffer;
        }

        const message = library.Message.decode(new Uint8Array(buf));
        console.log(message);
        // this.handleMessage(message);
      };
    });
  }
}

const worker = new LibraryLocation();
export default worker;
Comlink.expose(worker);
