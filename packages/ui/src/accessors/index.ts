import { Signal, createEffect, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Channel, createLocalSource } from 'client-api';
import { IndexEntryMessage } from 'proto';

export function indexAccessor(params: {
  locations: Signal<string[]>;
}) {
  createEffect(() => {
    request(params.locations[0]());
  });

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
    request,
    params,
    store,
  };
}
