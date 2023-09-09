import { ClientStorage } from "./ClientStorage.ts";

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

const storage = new ClientStorage();

class LibraryLocation {

  async thumbnail(file: string) {
    return fetch(`http://127.0.0.1:8000/api/thumbnail?file=${file}`, {
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
    } = await fetch(`http://127.0.0.1:8000/api/metadata?file=${file}`).then((res) => res.json());

    return meta;
  }

  async open() {
    return fetch('http://127.0.0.1:8000/api/library/index').then(async (res) => {
      const list = await res.json();

      const entries = await Promise.allSettled<Entry[]>(
        list.map(async (src: string) => {
          return fetch(`http://127.0.0.1:8000/api/metadata?file=${encodeURIComponent(src)}`).then(
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

      return {
        host: 'http://127.0.0.1:8000',
        path: '/Users/tihav/Pictures',
        entries: entries.map((res) => res.value).filter(Boolean),
        index: list,
      }
    });
  }

}

export default new LibraryLocation();
