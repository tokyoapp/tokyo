import * as Comlink from 'comlink';
import { LocalLibrary } from './api/LocalLibrary.js';
import * as library from 'tokyo-proto';

type RemoteLibrary = typeof import('./api/RemoteLibrary.ts').default;

type MessageType =
  | 'locations'
  | 'locations.mutate'
  | 'index'
  | 'metadata'
  | 'metadata.mutate'
  | 'thumbnails';

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

export function createRemoteSource(url: string): LibraryInterface {
  const worker = new Worker(new URL('./RemoteLibrary.ts', import.meta.url), {
    type: 'module',
  });
  const wrappedWorker = Comlink.wrap<RemoteLibrary>(worker);

  worker.onerror = (err) => {
    throw new Error(err.message);
  };

  wrappedWorker.connect(url);

  return wrappedWorker;
}

export function createLocalSource() {
  const lib = new LocalLibrary();

  let controller: ReadableStreamDefaultController<any>;

  const read = new ReadableStream({
    start(ctlr) {
      controller = ctlr;
    },
  });

  const write = new WritableStream({
    write(chunk) {
      switch (chunk.type as MessageType) {
        case 'locations.mutate':
          lib.postLocation(chunk.name, chunk.path);
          break;
        case 'locations':
          lib.fetchLocations().then((msg) => {
            controller.enqueue(msg);
          });
          break;
        case 'index':
          lib.fetchIndex(chunk.locations).then((msg) => {
            if (msg) controller.enqueue(msg);
          });
          break;
        case 'thumbnails':
          lib.fetchThumbmails(chunk.ids).then((msg) => {
            if (msg) controller.enqueue(msg);
          });
          break;
        case 'metadata':
          lib.fetchMetadata(chunk.ids).then((msg) => {
            if (msg) controller.enqueue(msg);
          });
          break;
        case 'metadata.mutate':
          console.warn('not implemented');
          break;
        default:
          console.error('chunk.type', chunk.type, 'no handled.');
      }
    },
  });

  return [read, write] as const;
}

export { Channel } from './Accessor.tsx';
