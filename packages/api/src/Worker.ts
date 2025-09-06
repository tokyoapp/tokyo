import * as Comlink from "comlink";
import type * as library from "tokyo-schema";
import RemoteLibrary from "./api/RemoteLibrary.ts?worker";

type Remote = typeof import("./api/RemoteLibrary.ts").default;
type Message = ReturnType<Remote["parseMessage"]>;

const worker = new RemoteLibrary();
const wrappedWorker = Comlink.wrap<Remote>(worker);

const url = "127.0.0.1:8000/ws";
wrappedWorker.connect(url);

worker.onerror = (err) => {
  console.error("Error in worker:", err);
};

export default {
  stream() {
    const read = new ReadableStream<Message>({
      start(ctlr) {
        wrappedWorker.onMessage(
          Comlink.proxy((msg) => {
            ctlr.enqueue(msg);
          }),
        );
      },
    });

    const write = new WritableStream<library.ClientMessage>({
      write(chunk) {
        wrappedWorker.send(chunk);
      },
    });

    return [read, write] as const;
  },
};
