import { createStore } from 'solid-js/store';

const [location, setLocation] = createStore<{
  host?: string;
  index: string[];
}>({
  index: [],
});

export { location };

fetch('http://localhost:8000/').then(async (res) => {
  const list = await res.json();

  setLocation({
    host: 'http://localhost:8000',
    index: list,
  });
});
