import * as Comlink from 'comlink';
import { LocalLibrary } from './LocalLibrary.js';
import * as library from 'proto';

type RemoteLibrary = typeof import('./RemoteLibrary.ts').default;

async function createRemoteLocationWorker(url: string): Promise<LibraryInterface> {
  const worker = new Worker(new URL('./RemoteLibrary.ts', import.meta.url), {
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

export interface ClientAPIMessage<T> {
  type: MessageType;
  data: T;
}

// Interface to a single Libary
export interface LibraryInterface {
  onMessage(cb: (msg: ClientAPIMessage<MessageData>) => void, id?: number): Promise<() => void>;

  fetchLocations(): Promise<ClientAPIMessage<library.LibraryMessage[]>>;
  fetchIndex(locations: string[]): Promise<ClientAPIMessage<library.IndexEntryMessage[]>>;
}

// Access to one or multiple libraries, remote and local, through a simple API.
// This also includes local caching of thumbnails.

class Channel<T> {
  // ports can be transferred over threads
  #ch = new MessageChannel();

  #request = (params: string[]) => {
    params;
  };

  #stream: (self: Channel<T>) => ReadableStream<T>;

  constructor(options: {
    request: (params: string[]) => void;
    stream: (self: Channel<T>) => ReadableStream<T>;
  }) {
    this.#request = options.request;
    this.#stream = options.stream;
  }

  onConnect() {
    // TOOD: auto fetch data from newly connected sources
  }

  stream() {
    return this.#stream(this);
  }

  emit(data: T) {
    this.#ch.port2.postMessage(data);
  }

  subscribe(cb: (data: T) => void) {
    this.#ch.port1.onmessage = (msg) => {};

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
  static connections = new Set<LibraryInterface>(
    window.__TAURI_INVOKE__ ? [new LocalLibrary()] : []
  );

  static connectionListeners = new Set<(conn: LibraryInterface) => void>();

  static onConnection(cb: (conn: LibraryInterface) => void) {
    this.connectionListeners.add(cb);
  }

  static locations() {
    return new Channel<library.LibraryMessage>({
      request: () => {
        for (const conn of this.connections) {
          conn.fetchLocations();
        }
      },
      stream: (self) => {
        return new ReadableStream({
          start: (controller) => {
            this.onConnection((conn) => {
              conn.fetchLocations().then((locations) => {
                locations.data.forEach((element) => {
                  controller.enqueue(element);
                });
              });
            });

            // self.subscribe((msg) => {
            //   console.log(msg);
            // });

            Promise.all(
              [...this.connections].map(async (conn) => {
                // TODO: handle subscription
                // conn.onMessage(
                //   Comlink.proxy((msg) => {
                //     console.log('msg', msg);
                //   })
                // );

                return conn.fetchLocations().then((locations) => {
                  locations.data.forEach((element) => {
                    self.emit(element);
                    controller.enqueue(element);
                  });
                });
              })
            ).then(() => {
              // controller.close();
            });
          },
        });
      },
    });
  }

  static index(locations: string[]) {
    return new Channel<library.IndexEntryMessage>({
      request: () => {
        for (const conn of this.connections) {
          conn.fetchIndex(locations);
        }
      },
      stream: () => {
        return new ReadableStream({
          start: (controller) => {
            this.onConnection((conn) => {
              conn.fetchIndex(locations).then((entires) => {
                entires.data.forEach((entry) => {
                  controller.enqueue(entry);
                });
              });
            });

            Promise.all(
              [...this.connections].map((conn) => {
                return conn.fetchIndex(locations).then((index) => {
                  index.data?.index?.forEach((entry) => {
                    controller.enqueue(entry);
                  });
                });
              })
            ).then(() => {
              controller.close();
            });
          },
        });
      },
    });
  }

  static async metadata(id: string) {}

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

    // new connection
    if (conn) {
      this.connections.add(conn);
      this.connectionListeners.forEach((cb) => cb(conn));
    }
  }
}
