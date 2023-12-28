/// <reference lib="webworker" />

import * as Comlink from 'comlink';
import * as library from 'tokyo-proto';
import { ClientAPIMessage, RequestMessage } from '../lib';

let msg_count = 1;

export class RemoteLibrary {
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

  public fetchIndex(locations: string[]): Promise<ClientAPIMessage> {
    const msg = library.ClientMessage.create({
      id: ++msg_count,
      index: library.RequestLibraryIndex.create({
        ids: locations,
      }),
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

  connect(host: string) {
    console.log('worker connecting to', host);

    const self = this;

    const ws = new WebSocket(`ws://${host}`);

    ws.onopen = () => {
      console.log('[WS] Connected');
    };
    ws.onerror = (err) => {
      console.error('[WS] Error: ', err);
    };

    const rx = new ReadableStream<Blob | DataView>({
      start(controller) {
        ws.onmessage = async (msg) => {
          console.log('[WS]', msg);
          controller.enqueue(msg.data);
        };
      },
    });

    this.ws = ws;

    rx.pipeThrough(
      new TransformStream<Blob | DataView, library.Message>({
        async transform(msg, controller) {
          let buf;
          if (msg instanceof Blob) {
            buf = await (msg as Blob).arrayBuffer();
          } else {
            buf = msg.buffer;
          }

          const message = library.Message.decode(new Uint8Array(buf));
          controller.enqueue(message);
        },
      })
    ).pipeTo(
      new WritableStream({
        write(message) {
          for (const listener of self.messageListeners) {
            listener(message);
          }
        },
      })
    );
  }
}

const worker = new RemoteLibrary();
export default worker;
Comlink.expose(worker);
