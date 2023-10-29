import { onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Channel, createLocalSource } from 'client-api';
import { IndexEntryMessage } from 'proto';

export function indexAccessor() {
  const locations = new Set<string>();

  const [store, setStore] = createStore<Array<{ source_id: string } & IndexEntryMessage>>([]);

  const channel = new Channel();

  const [read, write] = createLocalSource();

  channel.connect(read, write);

  const currentSub = channel.subscribe(async (chunk) => {
    if (chunk.data === null) {
      setStore(
        store.filter((entry) => {
          return entry.source_id !== chunk.source_id;
        })
      );
    } else {
      // TODO: there can be duplicate items in these chunks, should dedupe them here.
      setStore([
        ...store,
        ...chunk.data.map((entry) => {
          return {
            ...entry,
            source_id: chunk.source_id,
          };
        }),
      ]);
    }
  });

  onCleanup(() => {
    currentSub();
  });

  const request = (locations: string[]) => {
    channel.send({
      type: 'index',
      locations,
    });
  };

  return {
    // request,
    get locations(): string[] {
      return [...locations];
    },
    set locations(ids: string[]) {
      locations.clear();
      ids.forEach((id) => locations.add(id));
      request([...locations]);
    },
    store,
  };
}
