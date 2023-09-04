import { createStore } from 'solid-js/store';

type Entry = {
  path: string;
  meta: Meta;
};

export type Location = {
  host?: string;
  path: string;
  entries: Entry[];
  index: string[];
};

const [location, setLocation] = createStore<Location>({
  entries: [],
  path: '',
  index: [],
});

export { location };

type Exif = {
  exposure_time: string;
  fnumber: string;
  iso_speed_ratings: string;
  focal_length: string;
};

type Meta = {
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
    path: '/Users/tihav/Pictures',
    entries: entries.map((res) => res.value).filter(Boolean),
    index: list,
  });
});
