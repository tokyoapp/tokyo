import RemoteLibrary from './api/RemoteLibrary.ts?worker';

import * as Comlink from 'comlink';
import { MessageType } from './lib.ts';

export default {
  stream() {
    const url = '127.0.0.1:8000/ws';

    const worker = new RemoteLibrary();
    const wrappedWorker = Comlink.wrap<typeof import('./api/RemoteLibrary.ts').default>(worker);

    worker.onerror = (err) => {
      console.error('Error in worker:', err);
    };

    wrappedWorker.connect(url);

    const read = new ReadableStream<{ _type: MessageType }>({
      start(ctlr) {
        wrappedWorker.onMessage(
          Comlink.proxy((msg) => {
            console.log(msg);

            ctlr.enqueue(msg);
          })
        );
      },
    });

    const write = new WritableStream({
      write(chunk) {
        wrappedWorker.send(chunk);
      },
    });

    return [read, write] as const;
  },
};
