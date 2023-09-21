import library from './services/LibraryLocation.worker.ts';
import { createSignal } from 'solid-js';

export type Entry = {
  hash: string;
  name: string;
  path: string;
  createDate: string;
  rating: number;
  orientation: number;
};

export type Location = {
  host?: string;
  name: string;
  path: string;
  index: Entry[];
};

type Exif = {
  exposure_time: string;
  fnumber: string;
  iso_speed_ratings: string;
  focal_length: string;
};

export type Meta = {
  hash: string;
  name: string;
  width: number;
  height: number;
  exif: Exif;
  rating: number;
  make: string;
  create_date: string;
  orientation: number;
};

export const [location, setLocation] = createSignal<Location>({
  host: '',
  name: 'default',
  path: '',
  index: [],
});

export const [file, setFile] = createSignal<Entry>();

export const [libs, setLibs] = createSignal([]);

export class Library {
  static async metadata(file: string) {
    return await library.metadata(file);
  }

  static async tags() {
    return await library.tags();
  }

  static open(name: string) {
    library.list().then((libs) => {
      setLibs(libs);
    });

    library.open(name).then((index) => {
      const loc = {
        host: '127.0.0.1:8000',
        name: name,
        path: '/',
        index: index.map((entry) => {
          const e: Entry = {
            createDate: entry.createDate || '',
            name: entry.name || '',
            path: entry.path || '',
            rating: entry.rating || 0,
            hash: entry.hash || '',
            orientation: entry.orientation || 0,
          };
          return e;
        }),
      };
      console.log(loc);

      setLocation(loc);
    });
  }
}

// import { invoke } from '@tauri-apps/api/tauri';
// invoke('list').then((list) => console.log('local libs', list));
