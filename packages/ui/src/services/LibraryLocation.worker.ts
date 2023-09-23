import * as library from 'proto';
import { ClientStorage } from './ClientStorage.ts';

const storage = new ClientStorage();

let msg_count = 1;

class LibraryLocation {
  ws!: WebSocket;

  indexListeners = new Set<(arg: library.Message) => void>();
  listListeners = new Set<(arg: library.Message) => void>();
  metadataListeners = new Set<(arg: library.Message) => void>();
  imageListeners = new Set<(arg: library.Message) => void>();

  public onIndex(callback: (arg: library.Message) => void) {
    this.indexListeners.add(callback);
    return () => this.indexListeners.delete(callback);
  }

  public onList(callback: (arg: library.Message) => void) {
    this.listListeners.add(callback);
    return () => this.listListeners.delete(callback);
  }

  public onMetadata(callback: (arg: library.Message) => void) {
    this.metadataListeners.add(callback);
    return () => this.metadataListeners.delete(callback);
  }

  public onImage(callback: (arg: library.Message) => void) {
    this.imageListeners.add(callback);
    return () => this.imageListeners.delete(callback);
  }

  private async handleMessage(message: library.Message) {
    const type =
      message.error || message.image || message.index || message.list || message.metadata;

    switch (type) {
      case message.error: {
        console.error('Error response:', message);
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
        const file = message.metadata?.hash;
        const thumbnail = message.metadata?.thumbnail;
        if (file && thumbnail) {
          const blob = new Blob([thumbnail]);
          storage.writeTemp(file, await blob.arrayBuffer());
        }

        if (message.metadata) {
          this.metadataListeners.forEach((cb) => cb(message));
        }
        break;
      }
      case message.image: {
        this.imageListeners.forEach((cb) => cb(message));
        break;
      }
    }
  }

  private onConnected(name: string) {
    console.log('[WS] Connected');

    const msg = library.ClientMessage.create({
      id: 0,
      index: library.RequestLibraryIndex.create({
        name,
      }),
    });
    const data = library.ClientMessage.encode(msg).finish();
    this.ws.send(data);
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

  async open(name: string): Promise<void> {
    return new Promise((resolve) => {
      this.ws = new WebSocket('ws://192.168.1.11:8000/ws');

      this.ws.onopen = () => {
        this.onConnected(name);

        resolve();
      };

      this.ws.onerror = (err) => {
        console.error('[WS] Error: ', err);
      };

      this.ws.onmessage = async (msg) => {
        const buf = await (msg.data as Blob).arrayBuffer();
        const message = library.Message.decode(new Uint8Array(buf));
        this.handleMessage(message);
      };
    });
  }
}

export default new LibraryLocation();
