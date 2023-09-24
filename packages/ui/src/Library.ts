import library from './services/LibraryLocation.worker.ts';
import * as Comlink from 'comlink';
import { IndexEntryMessage, LibraryMessage, SystemInfo, TagMessage } from 'proto';
import { createSignal } from 'solid-js';
import { Notifications } from './components/notifications/Notifications.ts';
import { ErrorNotification } from './components/notifications/index.ts';

export type Location = {
  host?: string;
  name: string;
  path: string;
  index: IndexEntryMessage[];
};

export const [location, setLocation] = createSignal<Location>({
  host: '',
  name: 'default',
  path: '',
  index: [],
});

export const [file, setFile] = createSignal<IndexEntryMessage>();

export const [libs, setLibs] = createSignal<LibraryMessage[]>([]);

export const [tags, setTags] = createSignal<TagMessage[]>([]);

export const [sysinfo, setSysInfo] = createSignal<SystemInfo>();

export class Library {
  static async metadata(file: string) {
    return await library.getMetadata(file);
  }

  static async postMetadata(
    file: string,
    metadata: {
      rating?: number;
      tags?: string[];
    }
  ) {
    return await library.postMetadata(file, {
      rating: metadata.rating,
    });
  }

  static async create() {
    return await library.createLocation();
  }

  static open(name: string) {
    library.onIndex(
      Comlink.proxy((msg) => {
        const index = msg.index?.index;

        if (index && index.length > 1) {
          const loc = {
            host: '127.0.0.1:8000',
            name: name,
            path: '/',
            index: index,
          };

          setLocation(loc);

          const item = file();
          const index_item = loc.index.find((entry) => entry.hash === item?.hash);
          if (index_item) {
            setFile(index_item);
          }
        }
      })
    );

    library.onList(
      Comlink.proxy((list) => {
        setLibs(list.list?.libraries);
        setTags(list.list?.tags);
      })
    );

    library.onSystem(
      Comlink.proxy((msg) => {
        setSysInfo(msg.system);
      })
    );

    library.onError(
      Comlink.proxy((err) => {
        Notifications.push(
          new ErrorNotification({
            message: `Error: ${err.message}`,
            time: 3000,
          })
        );
      })
    );

    return library.open(name);
  }
}
