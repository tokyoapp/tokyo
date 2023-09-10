import { ClientStorage } from './ClientStorage.ts';

type Entry = {
  path: string;
  meta: Meta;
};

export type Location = {
  host?: string;
  name: string;
  path: string;
  entries: Entry[];
  index: string[];
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

const storage = new ClientStorage();

class LibraryLocation {
  async list() {
    return fetch('http://127.0.0.1:8000/api/library/list', {}).then(async (res) => {
      return res.json();
    });
  }

  async thumbnail(file: string) {
    return fetch(`http://127.0.0.1:8000/api/local/thumbnail?file=${file}`, {
      // signal: controller.signal,
    }).then(async (res) => {
      const buffer = await res.arrayBuffer();
      const blob = new Blob([buffer]);
      storage.writeTemp(file, await blob.arrayBuffer());
      return blob;
    });
  }

  async metadata(file: string) {
    const meta: {
      width: number;
      height: number;
      orientation: number;
    } = await fetch(`http://127.0.0.1:8000/api/local/metadata?file=${file}`).then((res) =>
      res.json()
    );

    return meta;
  }

  async open(name: string) {
    const loc: Location = {
      host: 'http://127.0.0.1:8000',
      name: name,
      path: '/Users/tihav/Pictures',
      entries: [],
      index: [],
    };

    return fetch(`http://127.0.0.1:8000/api/library/index?name=${loc.name}`).then(async (res) => {
      const list = await res.json();

      const entries = await Promise.allSettled<Entry[]>(
        list.map(async (src: string) => {
          return fetch(
            `http://127.0.0.1:8000/api/local/metadata?file=${encodeURIComponent(src)}`
          ).then(async (res) => {
            const meta = (await res.json()) as Meta;
            return {
              path: src,
              meta: meta,
            };
          });
        })
      );

      loc.index = list;
      loc.entries = entries.map((res) => res.value).filter(Boolean);

      return loc;
    });
  }
}

export default new LibraryLocation();
