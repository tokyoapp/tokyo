import { createStore } from 'solid-js/store';
import library, { type Location } from './services/LibraryLocation.worker.ts';

export const [location, setLocation] = createStore<Location>({
  entries: [],
  path: '',
  index: [],
});


library.open().then(loc => {
  setLocation(loc);
})
