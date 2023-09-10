import { createStore } from 'solid-js/store';
import library, { type Location } from './services/LibraryLocation.worker.ts';

export const [location, setLocation] = createStore<Location>({
  host: '',
  name: 'default',
  path: '',
  entries: [],
  index: [],
});

library.open(location.name).then((loc) => {
  setLocation(loc);
});
