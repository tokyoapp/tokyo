import * as library from 'proto';
import { ClientStorage } from './ClientStorage.ts';

const storage = new ClientStorage();

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

  async open(name: string): Promise<library.IndexEntryMessage[]> {
    return new Promise((resolve) => {
      const ws = new WebSocket('ws://127.0.0.1:8000/ws');
      ws.onopen = () => {
        console.log('[WS] Connected');

        const indxMsg = library.ClientMessage.create({
          id: 0,
          index: library.RequestLibraryIndex.create({
            name,
          }),
        });

        const data = library.ClientMessage.encode(indxMsg).finish();
        ws.send(data);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error: ', err);
      };

      ws.onmessage = async (msg) => {
        const data = msg.data as Blob;
        const buf = await data.arrayBuffer();

        const message = library.Message.decode(new Uint8Array(buf));

        if (message.index?.index) {
          resolve(message.index.index);
        }
      };
    });
  }
}

export default new LibraryLocation();
