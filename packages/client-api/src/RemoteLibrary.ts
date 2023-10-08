/// <reference lib="webworker" />

import * as Comlink from 'comlink';
import * as library from 'proto';
import { ClientAPIMessage, LibraryInterface } from './lib';

let msg_count = 1;

export class LibraryLocation implements LibraryInterface {
  ws!: WebSocket;

  messageListeners = new Set<(arg: library.Message) => void>();

  public async onMessage(callback: (arg: ClientAPIMessage) => void, id?: number) {
    const listener = async (msg: library.Message) => {
      if (id !== undefined && id !== msg.id) {
        return;
      }

      const handledMessage = await this.handleMessage(msg);
      if (handledMessage) {
        callback(handledMessage);
      }
    };
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public fetchLocations() {
    const msg = library.ClientMessage.create({
      id: ++msg_count,
      locations: library.RequestLocations.create({}),
    });
    const data = library.ClientMessage.encode(msg).finish();

    const res = new Promise<ClientAPIMessage>(async (resolve) => {
      const unsub = await this.onMessage(async (msg) => {
        unsub();
        resolve(msg);
      }, msg.id);
    });

    this.ws.send(data);

    return res;
  }

  private async handleMessage(message: library.Message): Promise<ClientAPIMessage | undefined> {
    const type =
      message.error ||
      message.image ||
      message.index ||
      message.list ||
      message.metadata ||
      message.system;

    switch (type) {
      case message.error: {
        throw new Error('Error response, ' + JSON.stringify(message));
      }
      case message.index: {
        if (message.index) {
          return {
            type: 'index',
            data: message.index,
          };
        }
        break;
      }
      case message.list: {
        if (message.list) {
          return {
            type: 'locations',
            data: message.list.libraries,
          };
        }
        break;
      }
      case message.metadata: {
        // const file = message.metadata?.hash;
        // const thumbnail = message.metadata?.thumbnail;
        // if (file && thumbnail) {
        //   const blob = new Blob([thumbnail]);
        //   storage.writeTemp(file, await blob.arrayBuffer());
        // }
        //
        if (message.metadata) {
          return {
            type: 'metadata',
            data: message.metadata,
          };
        }
        break;
      }
      case message.image: {
        return {
          type: 'image',
          data: message.image,
        };
      }
      case message.system: {
        return {
          type: 'system',
          data: message.system,
        };
      }
    }

    return undefined;
  }

  send(msg: library.ClientMessage) {
    this.ws.send(library.ClientMessage.encode(msg).finish());
  }

  postLocation() {
    const msg = library.ClientMessage.create({
      create: library.CreateLibraryMessage.create({
        name: 'Desktop',
        path: '/Users/tihav/Desktop',
      }),
    });
    this.send(msg);
  }

  connect(host: string): Promise<void> {
    console.log('worker connecting to', host);

    return new Promise((resolve) => {
      this.ws = new WebSocket(`ws://${host}/ws`);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        resolve();
      };
      this.ws.onerror = (err) => {
        console.error('[WS] Error: ', err);
      };
      this.ws.onmessage = async (msg) => {
        let buf;
        if (msg.data instanceof Blob) {
          buf = await (msg.data as Blob).arrayBuffer();
        } else {
          buf = msg.data.buffer;
        }

        const message = library.Message.decode(new Uint8Array(buf));
        this.messageListeners.forEach(cb => cb(message));
      };
    });
  }
}

const worker = new LibraryLocation();
export default worker;
Comlink.expose(worker);
