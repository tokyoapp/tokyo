import { request } from "tauri-plugin-tokyo";
import * as library from "tokyo-schema";
import { parseMessage } from "../MessageTypes.ts";

export class HostLibrary {
  stream() {
    let controller: ReadableStreamDefaultController<any>;

    const read = new ReadableStream<ReturnType<typeof parseMessage>>({
      start(ctlr) {
        controller = ctlr;
      },
    });

    const write = new WritableStream<library.ClientMessage>({
      async write(chunk) {
        const res = await request(library.ClientMessage.create(chunk));
        const msg = parseMessage(res);
        controller.enqueue(msg);
      },
    });

    return [read, write] as const;
  }
}
