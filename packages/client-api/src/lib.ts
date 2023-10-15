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

export function createLocalSource() {
  const lib = new LocalLibrary();

  let reset = false;
  let id: undefined | string;

  const read = new ReadableStream({
    start(controller) {
      onmessage = () => {
        if (id) {
          // Part of list
          controller.enqueue({
            id: id,
            data: [
              {
                value: Math.random(),
              },
            ],
          });

          if (reset) {
            reset = false;
            // Invalidate old data
            controller.enqueue({ id: id, data: null });
          }
        }
      };
    },
  });

  const write = new WritableStream({
    write(chunk) {
      id = chunk.id;
      reset = true;
    },
  });

  return [read, write] as const;
}

export { Channel } from './Accessor.tsx';
