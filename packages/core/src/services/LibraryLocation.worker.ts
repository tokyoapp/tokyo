import proto from 'proto';
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

import library from 'proto';

class LibraryLocation {
  async list() {
    return fetch('http://127.0.0.1:8000/api/proto', {}).then(async (res) => {
      const list = library.Message.decode(new Uint8Array(await res.arrayBuffer()));
      return list.list?.libraries;
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
    return new Promise((resolve) => {
      const loc: Location = {
        host: 'http://127.0.0.1:8000',
        name: name,
        path: '/Users/tihav/Pictures',
        entries: [],
        index: [],
      };

      const ws = new WebSocket('ws://127.0.0.1:8000/ws');
      ws.onopen = () => {
        console.log('[WS] Connected');
      };

      ws.onmessage = async (msg) => {
        const data = msg.data as Blob;
        const buf = await data.arrayBuffer();

        const message = proto.Message.decode(new Uint8Array(buf));

        if (message.index?.index) {
          const metaCalls = message.index.index.map(async (src: string) => {
            return fetch(
              `http://127.0.0.1:8000/api/local/metadata?file=${encodeURIComponent(src)}`
            ).then(async (res) => {
              const meta = (await res.json()) as Meta;
              return {
                path: src,
                meta: meta,
              };
            });
          });

          const entries: Entry[] = (await Promise.allSettled(metaCalls)).map((prom) => prom.value);

          loc.index = message.index.index;
          loc.entries = entries.filter(Boolean);

          resolve(loc);
        }
      };
    });
  }
}

export default new LibraryLocation();
