import library from './services/LibraryLocation.worker.ts';
import * as Comlink from 'comlink';
import { IndexEntryMessage, LibraryMessage, SystemInfo, TagMessage } from 'proto';
import { createSignal } from 'solid-js';
import { Notifications } from './components/notifications/Notifications.ts';
import { ErrorNotification } from './components/notifications/index.ts';
import { index, list, system, metadata } from 'tauri-plugin-library-api';

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
    return await metadata(file);
    // return await library.getMetadata(file);
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

  static async list() {
    return list().catch((err) => {
      console.error('error', err);
    });
  }

  static async system() {
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

  static async index(name: string) {
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

  static open(uri: string) {
    const [host_or_name, path] = uri.split(':');
    const name = path || host_or_name;
    const host = path ? host_or_name : undefined;

    console.log('Open:', name, 'at', host || 'local');

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
