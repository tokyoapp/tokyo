import { index, locations, thumbnail, system, metadata, createLocation } from 'tauri-plugin-tokyo';
import { ClientAPIMessage, LibraryInterface } from '../lib';

export class LocalLibrary implements LibraryInterface {
  public async fetchLocations(): Promise<ClientAPIMessage> {
    return {
      type: 'locations' as const,
      data: await locations(),
    };
  }

  public async fetchIndex(locations: string[]): Promise<ClientAPIMessage> {
    if (locations.length > 0) {
      const res = {
        type: 'index' as const,
        data: await index(locations[0]),
      };
      return res;
    }
  }

  public async fetchThumbmails(ids: string[]): Promise<ClientAPIMessage> {
    if (ids.length > 0) {
      const res = {
        type: 'thumbnails' as const,
        data: await Promise.all(
          ids.map(async (id) => {
            return { thumbnail: await thumbnail(id), id };
          })
        ),
      };
      return res;
    }
  }

  public async fetchMetadata(ids: string[]): Promise<ClientAPIMessage> {
    if (ids.length > 0) {
      const res = {
        type: 'metadata' as const,
        data: await Promise.all(
          ids.map(async (id) => {
            return { metadata: await metadata(id), id };
          })
        ),
      };
      return res;
    }
  }

  onMessage(cb: (msg: ClientAPIMessage) => void, id?: number): Promise<() => void> {
    return new Promise((res, rej) => {
      rej('not implemented');
    });
  }

  async getMetadata(file: string) {
    return await metadata(file).then(async (meta) => {
      // const file = meta?.hash;
      // const thumbnail = meta?.thumbnail;
      // if (file && thumbnail) {
      //   const blob = new Blob([new Uint8Array(thumbnail)]);
      // }

      return {
        metadata: meta,
      };
    });
  }

  async postMetadata(
    file: string,
    metadata: {
      rating?: number;
      tags?: string[];
    }
  ) {}

  async postLocation(name: string, path: string) {
    return await createLocation(name, path).catch((err) => {
      console.error('error', err);
    });
  }

  async getSystem() {
    return system()
      .then((info) => {
        return info;
      })
      .catch((err) => {
        console.error('error', err);
      });
  }

  async getIndex(name: string) {
    return index(name)
      .then((index) => {
        const loc = {
          host: 'files',
          name: name,
          path: '/',
          index: index,
        };
        return loc;
      })
      .catch((err) => {
        console.error('error', err);
      });
  }
}
