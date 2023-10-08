import * as Comlink from 'comlink';
import { LocalLibrary } from './LocalLibrary.js';
import * as library from 'proto';

type RemoteLibrary = typeof import('./RemoteLibrary.js').default;

async function createRemoteLocationWorker(url: string): Promise<LibraryInterface> {
  const worker = new Worker(new URL('./RemoteLibrary.js', import.meta.url), {
    type: 'module',
  });
  const wrappedWorker = Comlink.wrap<RemoteLibrary>(worker);

  worker.onerror = (err) => {
    throw new Error(err.message);
  };

  await wrappedWorker.connect(url);

  return wrappedWorker;
}

type MessageType = 'locations' | 'index' | 'metadata';
type MessageData =
  | library.LibraryMessage
  | library.LibraryMessage[]
  | library.LibraryIndexMessage
  | library.IndexEntryMessage[]
  | library.MetadataMessage;

export interface ClientAPIMessage {
  type: MessageType;
  data: MessageData;
}

// Interface to a single Libary
export interface LibraryInterface {
  onMessage(cb: (msg: ClientAPIMessage) => void, id?: number): Promise<() => any>;

  fetchLocations(): Promise<ClientAPIMessage>;
}

// Access to one or multiple libraries, remote and local, through a simple API.
// This also includes local caching of thumbnails.

class Channel<T> {
  // ports can be transferred over threads
  #ch = new MessageChannel();

  #request = (params: string[]) => {
    params;
  };

  #stream: () => ReadableStream<T>;

  constructor(options: {
    request: (params: string[]) => void;
    stream: () => ReadableStream<T>;
  }) {
    this.#request = options.request;
    this.#stream = options.stream;
  }

  onConnect() {
    // TOOD: auto fetch data from newly connected sources
  }

  stream() {
    return this.#stream();
  }

  subscribe(cb: (data: T) => void) {
    this.#ch.port1.addEventListener('message', cb as EventListener);

    return () => {
      this.#ch.port1.removeEventListener('message', cb as EventListener);
    };
  }

  send(...params: string[]) {
    this.#request(params);
  }
}

export class LibraryApi {
  static connections = new Set<LibraryInterface>([new LocalLibrary()]);

  static locations = new Channel<ClientAPIMessage>({
    request: () => {
      for (const conn of this.connections) {
        conn.fetchLocations();
      }
    },
    stream: () => {
      return new ReadableStream({
        start: (controller) => {
          Promise.all(
            [...this.connections].map((conn) => {
              conn.fetchLocations().then((location) => {
                controller.enqueue(location);
              });
            })
          ).then(() => {
            controller.close();
          });
        },
        pull(controller) {
          controller;
        },
      });
    },
  });

  static index = new Channel<ClientAPIMessage>({
    request: () => {
      for (const conn of this.connections) {
        conn.fetchIndex();
      }
    },
    stream: () => {
      return new ReadableStream({
        start: (controller) => {
          Promise.all(
            // TOOD: dont request all locations' index, instead by location name
            [...this.connections].map((conn) => {
              conn.fetchIndex(conn.).then((index) => {
                controller.enqueue(index);
              });
            })
          ).then(() => {
            controller.close();
          });
        },
        pull(controller) {
          controller;
        },
      });
    },
  });

  static async connect(url: string) {
    // const [host_or_name, path] = url.split(':');
    // const name = path || host_or_name;
    // const host = path ? host_or_name : undefined;

    // console.log('Open:', name, 'at', host || 'local');

    // if (host) {
    // }
    console.log('Connecting to', url);
    const conn = await createRemoteLocationWorker(url).catch((err) => {
      console.error(err);
    });
    if (conn) this.connections.add(conn);
  }
}
