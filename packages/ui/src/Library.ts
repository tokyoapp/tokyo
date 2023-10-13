import { IndexEntryMessage, LibraryMessage, SystemInfo, TagMessage } from 'proto';
import { createSignal } from 'solid-js';
import { LibraryApi } from 'client-api';

// these should not be exported. Have em get by the accessor.
export const [file, setFile] = createSignal<IndexEntryMessage>();
export const [tags, setTags] = createSignal<TagMessage[]>([]);
export const [sysinfo, setSysInfo] = createSignal<SystemInfo>();

export const [locations, setLocations] = createSignal<LibraryMessage[]>([]);
export const [index, setIndex] = createSignal<IndexEntryMessage[]>([]);

class LibraryAccessor {
  constructor() {
    // LibraryApi.connect('0.0.0.0:8000');
  }

  async locations() {
    const channel = LibraryApi.locations();
    const stream = channel.stream();

    stream.pipeTo(
      new WritableStream({
        write(chunk) {
          setLocations([...locations(), chunk]);
        },
      })
    );

    return channel;
  }

  async index(locations: string[]) {
    const channel = LibraryApi.index(locations);
    const stream = channel.stream();

    // TODO: stream should close when not used anymore
    stream.pipeTo(
      new WritableStream({
        write(chunk) {
          setIndex([...index(), chunk]);
        },
      })
    );

    return channel;
  }

  async metadata(id: string) {
    // const channel = LibraryApi.metadata(locations);
    // const stream = channel.stream();
    // const indx = index();
    console.warn("metadata not implementd");

  }
}

export const Library = new LibraryAccessor();
