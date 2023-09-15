export { type Meta } from './services/LibraryLocation.worker.ts';

import { createStore } from 'solid-js/store';
import library, { type Location } from './services/LibraryLocation.worker.ts';

export const [location, setLocation] = createStore<Location>({
  host: '',
  name: 'default',
  path: '',
  entries: [],
  index: [],
});

library.open("default").then((loc) => {
  setLocation(loc);
});

export class Library {
  static metadata(file: string) {
    return library.metadata(file);
  }

  static list() {
    return library.list();
  }
}

// import { invoke } from '@tauri-apps/api/tauri';
// invoke('list').then((list) => console.log('local libs', list));
