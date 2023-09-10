import { createStore } from 'solid-js/store';
import library, { type Location } from './services/LibraryLocation.worker.ts';

export const [location, setLocation] = createStore<Location>({
  host: 'http://127.0.0.1:8000',
  name: 'default',
  path: '/Users/tihav/Pictures',
  entries: [],
  index: [],
});

library.open(location.name).then((loc) => {
  setLocation(loc);
});
