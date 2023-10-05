import * as Comlink from 'comlink';
import { Signal, createEffect, createSignal } from 'solid-js';
import { LocalLibrary } from './LocalLibrary.js';

type RemoteLibrary = typeof import('./RemoteLibrary.js').default;

async function createRemoteLocationWorker(url: string) {
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

// Access to one or multiple libraries, remote and local, through a simple API.
// This also includes local caching of thumbnails.

class Channel<T> {
  // ports can be transferred over threads
  #ch = new MessageChannel();
  #listener = (data: T) => {};

  subscribe(cb: (data: T) => void) {
    this.#listener = cb;
    this.#ch.port1.addEventListener('message', this.#listener);
  }

  request(...params: string[]) {}
}

export class LibraryApi {
  static connections = new Set<LocalLibrary | Comlink.Remote<RemoteLibrary>>([]);

  static async connect(url?: string) {
    // const [host_or_name, path] = url.split(':');
    // const name = path || host_or_name;
    // const host = path ? host_or_name : undefined;

    // console.log('Open:', name, 'at', host || 'local');

    // if (host) {
    // }
    if (url) {
      console.log('Connecting to', url);
      const conn = await createRemoteLocationWorker(url).catch((err) => {
        console.error(err);
      });
      if (conn) this.connections.add(conn);
    } else {
      this.connections.add(new LocalLibrary());
    }
  }

  static async postLocation(data: any) {
    // post data
  }

  static async postMetadata(data: any) {
    // post data
  }

  static async system(): Promise<any> {}

  static locations(): [ReadableStream<any>, () => void] {
    const subs = [];

    const request = () => {
      for (const conn of this.connections) {
        conn.requestLocations();
      }
    };

    const stream = new ReadableStream(
      {
        start: (controller) => {
          for (const conn of this.connections) {
            subs.push(
              conn.onList(
                Comlink.proxy((list) => {
                  controller.enqueue(list);
                })
              )
            );
          }
        },
        pull(controller) {
          // when is pull run?
        },
        cancel() {
          // unsub
        },
      },
      {
        highWaterMark: 10,
      }
    );

    return [stream, request];
  }

  static channels = {
    metadata: new Channel<number>(),
    index: new Channel<number>(),
    locations: new Channel<number>(),
  };

  static index(): [ReadableStream<any>, (name: string) => void] {
    // signals in ui
    const request = (name: string) => {
      for (const conn of this.connections) {
        conn.requestIndex(name);
      }
    };

    const subs = [];
    const stream = new ReadableStream({
      start: (controller) => {
        for (const conn of this.connections) {
          subs.push(
            conn.onIndex(
              Comlink.proxy((index) => {
                controller.enqueue(index);
                console.log(index);
              })
            )
          );
        }
      },
      pull(controller) {},
    });

    return [stream, request];
  }

  static async metadata(file_id: string): Promise<Signal<any>> {
    // signals in ui
    const [id, request] = createSignal(file_id);
    const [data, setData] = createSignal(undefined);

    createEffect(() => {
      this.channels.metadata.request(id());
    });

    // subscribe in api
    const unsub = this.channels.metadata.subscribe((metadata) => {
      if (metadata.id === id()) {
        setData(metadata);
      }
    });

    // onUnmounted(() => {
    //   unsub()
    // })

    // onMounted(() => {
    //   // sub again
    // })

    return [data, request];
  }

  static async image(): Promise<any> {}
}

// # App

// await LibraryApi.connect(); // local
await LibraryApi.connect('0.0.0.0:8000');

const [stream, request] = LibraryApi.locations();

const UI = WritableStream;

stream.pipeTo(
  new UI({
    // UI should display the latest state.
    //    Some component may merge with old data, some just use the latest.

    // With a Map the data could be deduped. id -> data
    // Generally need a solution to update a single item in a big list.
    // Without rerendering the whole list.
    write(chunk) {
      // filter
      console.log(chunk);
      // sort
    },
    close() {
      // sort
    },
  })
);

request();
