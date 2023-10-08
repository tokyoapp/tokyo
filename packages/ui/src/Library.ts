import { IndexEntryMessage, LibraryMessage, SystemInfo, TagMessage } from 'proto';
import { createSignal } from 'solid-js';
import { ClientAPIMessage, LibraryApi } from 'client-api';
import { createStore } from 'solid-js/store';

export type Location = {
  name: string;
  host?: string;
  path: string;
  index: IndexEntryMessage[];
};

export const [file, setFile] = createSignal<IndexEntryMessage>();
export const [tags, setTags] = createSignal<TagMessage[]>([]);
export const [sysinfo, setSysInfo] = createSignal<SystemInfo>();


export const [locations, setLocations] = createStore<any[]>([]);
export const [index, setIndex] = createStore<any[]>([]);

class LibraryAccessor {

  constructor() {
    LibraryApi.connect('0.0.0.0:8000');

    this.locations()
  }

  async locations() {
    const stream = LibraryApi.locations.stream();

    stream.pipeTo(
      new WritableStream({
        write(chunk) {
          setLocations([...locations, chunk]);
        },
        close() {
          LibraryApi.locations.subscribe((data) => {
            // TODO: merge new data with cached data
          });
        },
      })
    );

    return locations;
  }

  async index() {
    const stream = LibraryApi.index.stream();

    stream.pipeTo(
      new WritableStream({
        write(chunk) {
          setIndex([...index, chunk]);
        },
        close() {
          LibraryApi.index.subscribe((data) => {
            // TODO: merge new data with cached data
          });
        },
      })
    );

    return index;
  }
}

export const Library = new LibraryAccessor();
