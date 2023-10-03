import library, { type LibraryLocation } from './services/LibraryLocation.worker.ts';
import * as Comlink from 'comlink';
import { IndexEntryMessage, LibraryMessage, SystemInfo, TagMessage } from 'proto';
import { createSignal } from 'solid-js';
import { Notifications } from './components/notifications/Notifications.ts';
import { ErrorNotification } from './components/notifications/index.ts';
import { index, list, system, metadata } from 'tauri-plugin-library-api';
import storage from './services/ClientStorage.worker.ts';

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

class RemoteLibrary {
  #worker: LibraryLocation;

  async getMetadata(file: string) {
    return await library.getMetadata(file);
  }

  async postMetadata(
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

  async postLocation() {
    return await library.createLocation();
  }

  constructor(uri: string) {
    const [host_or_name, path] = uri.split(':');
    const name = path || host_or_name;
    const host = path ? host_or_name : undefined;

    console.log('Open:', name, 'at', host || 'local');

    // TODO: For the local lib use Tuari events here: https://tauri.app/v1/guides/features/events/

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

    library.open(name);
  }
}

class LocalLibrary {
  constructor() {}

  async getMetadata(file: string) {
    return await metadata(file).then(async (meta) => {
      const file = meta?.hash;
      const thumbnail = meta?.thumbnail;
      if (file && thumbnail) {
        const blob = new Blob([new Uint8Array(thumbnail)]);
        storage.writeTemp(file, await blob.arrayBuffer());
      }

      return {
        metadata: meta,
      };
    });
    // return await library.getMetadata(file);
  }

  async postMetadata(
    file: string,
    metadata: {
      rating?: number;
      tags?: string[];
    }
  ) {}

  async postLocation() {}

  async getLocations() {
    return list().catch((err) => {
      console.error('error', err);
    });
  }

  async getSystem() {
    return system()
      .then((info) => {
        setSysInfo({
          diskName: info.disk_name,
          diskSize: info.disk_size,
          diskAvailable: info.disk_available,
        });
      })
      .catch((err) => {
        console.error('error', err);
      });
  }

  async getIndex(name: string) {
    return index(name)
      .then((index) => {
        const loc = {
          host: '127.0.0.1:8000',
          name: name,
          path: '/',
          index: index.map((entry) => {
            entry.createDate = entry.create_date;
            return entry;
          }),
        };
        console.log(loc);
        setLocation(loc);
      })
      .catch((err) => {
        console.error('error', err);
      });
  }
}

// TODO: this should not be static since we can have multiple libraries from different sources at once.
//  Like one remote and one local Library.
export class Libraries {
  #libraries: Set<Library> = new Set([new LocalLibrary()]);
}
