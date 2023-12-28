import RemoteLibrary from './api/RemoteLibrary.ts?worker';

import * as Comlink from 'comlink';

export default {
  stream() {
    const url = '127.0.0.1:8000/ws';

    const worker = new RemoteLibrary();
    const wrappedWorker = Comlink.wrap<typeof import('./api/RemoteLibrary.ts').default>(worker);

    worker.onerror = (err) => {
      console.error('Error creating worker');
    };

    wrappedWorker.connect(url);

    let controller: ReadableStreamDefaultController<any>;

    const read = new ReadableStream({
      start(ctlr) {
        controller = ctlr;

        wrappedWorker.onMessage((msg) => {
          console.log(msg);

          controller.enqueue(msg);
        });
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
