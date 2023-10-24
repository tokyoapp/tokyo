import { index, locations, thumbnails, system, metadata } from 'tauri-plugin-library-api';
import { ClientAPIMessage, LibraryInterface } from './lib';

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
        data: await thumbnails(ids[0]),
      };
      return res;
    }
  }

  public async onMessage(
    cb: (msg: ClientAPIMessage) => void,
    id?: number | undefined
  ): Promise<() => any> {
    //
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
  ) { }

  async postLocation() { }

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
