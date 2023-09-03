import { createStore } from 'solid-js/store';

type Entry = {
  path: string;
  meta: Meta;
};

const [location, setLocation] = createStore<{
  host?: string;
  entries: Entry[];
  index: string[];
}>({
  entries: [],
  index: [],
});

export { location };

type Meta = {
  hash: string;
  width: number;
  height: number;
  exif: any;
  rating: number;
  make: string;
  create_date: string;
  orientation: number;
};

fetch('http://localhost:8000/').then(async (res) => {
  const list = await res.json();

  const entries = await Promise.allSettled<Entry[]>(
    list.map(async (src: string) => {
      return fetch(`http://localhost:8000/metadata?file=${encodeURIComponent(src)}`).then(
        async (res) => {
          const meta = (await res.json()) as Meta;
          return {
            path: src,
            meta: meta,
          };
        }
      );
    })
  );

  setLocation({
    host: 'http://localhost:8000',
    entries: entries.map((res) => res.value).filter(Boolean),
    index: list,
  });
});
