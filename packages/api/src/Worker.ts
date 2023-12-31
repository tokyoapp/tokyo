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

        wrappedWorker.onMessage(
          Comlink.proxy((msg) => {
            controller.enqueue(msg);
          })
        );
      },
    });

    const write = new WritableStream({
      write(chunk) {
        switch (chunk._type) {
          case 'locations':
            wrappedWorker.fetchLocations();
            break;
          case 'index':
            wrappedWorker.fetchIndex(chunk.locations);
            break;
          default:
            throw new Error(`Request message "${chunk._type}" not handled.`);
        }
      },
    });

    return [read, write] as const;
  },
};
