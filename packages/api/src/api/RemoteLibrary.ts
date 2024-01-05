/// <reference lib="webworker" />

import * as Comlink from 'comlink';
import * as library from 'tokyo-proto';
import { MessageType } from '../lib.ts';

const messageKeyToType = {
  error: MessageType.Error,
  list: MessageType.Locations,
  index: MessageType.Index,
  metadata: MessageType.Metadata,
};

export class RemoteLibrary {
  ws!: WebSocket;

  messageListeners = new Set<(arg: library.Message) => void>();

  public async onMessage(callback: (arg: any) => void, id?: number) {
    const listener = async (msg: library.Message) => {
      if (id !== undefined && id !== msg.id) {
        return;
      }

      for (const key in msg) {
        if (msg[key] !== undefined) {
          callback({
            _type: messageKeyToType[key] || key,
            data: msg[key],
          });
          return;
        }
      }

      callback({
        _type: MessageType.Error,
        message: 'Message not handled',
      });
    };
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  backlog: library.ClientMessage[] = [];

  send(msg: library.ClientMessage) {
    console.log('RemoteLibrary.send', msg);

    if (this.ws.readyState !== this.ws.OPEN) {
      this.backlog.push(msg);
    } else {
      const req = library.ClientMessage.encode(msg).finish();
      this.ws.send(req);
    }
  }

  retryTimeoutDuration = 1000;
  retryTimeout: number | undefined = undefined;

  retry(host: string) {
    console.log('[WS] Retrying in 1 second');

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.retryTimeout = setTimeout(() => {
      this.connect(host);
      this.retryTimeout = undefined;
    }, this.retryTimeoutDuration);
  }

  connect(host: string) {
    console.log('worker connecting to', host);

    const self = this;

    const ws = new WebSocket(`ws://${host}`);

    ws.onopen = () => {
      console.log('[WS] Connected');

      for (const req of this.backlog) {
        this.send(req);
      }

      this.backlog = [];

      const rx = new ReadableStream<Blob | DataView>({
        start(controller) {
          ws.onmessage = (msg) => {
            controller.enqueue(msg.data);
          };
        },
      });

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
    };
    ws.onerror = (err) => {
      console.error('[WS] Connection error: ', err);
      this.retry(host);
    };

    this.ws = ws;
  }
}

const worker = new RemoteLibrary();
export default worker;
Comlink.expose(worker);
