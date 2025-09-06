/// <reference lib="webworker" />

import * as Comlink from "comlink";
import * as library from "tokyo-schema";
import { parseMessage } from "../MessageTypes.ts";

export class RemoteLibrary {
  ws!: WebSocket;

  messageListeners = new Set<(arg: library.Message) => void>();

  public async onMessage(callback: (arg: any) => void) {
    const listener = async (msg: library.Message) => {
      callback(parseMessage(msg));
    };
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  private emit(message: any) {
    for (const listener of this.messageListeners) {
      listener(message);
    }
  }

  backlog: library.ClientMessage[] = [];

  send(msg: library.ClientMessage) {
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
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.retryTimeout = setTimeout(() => {
      this.connect(host);
    }, this.retryTimeoutDuration);
  }

  connect(host: string) {
    const ws = new WebSocket(`ws://${host}`);

    ws.onopen = () => {
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

      // TODO: should transfer (Comlink.transfer) a stream instead of a event listener
      rx.pipeThrough(
        new TransformStream<Blob | DataView, library.Message>({
          async transform(msg, controller) {
            let buf: ArrayBuffer;
            if (msg instanceof Blob) {
              buf = await (msg as Blob).arrayBuffer();
            } else {
              buf = msg.buffer;
            }

            const message = library.Message.decode(new Uint8Array(buf));
            controller.enqueue(message);
          },
        }),
      ).pipeTo(
        new WritableStream({
          write: (message) => {
            this.emit(message);
          },
        }),
      );
    };
    ws.onerror = (err) => {
      console.error("[WS] Connection error: ", err);
      this.retry(host);
    };

    this.ws = ws;
  }
}

const worker = new RemoteLibrary();
export default worker;
Comlink.expose(worker);
