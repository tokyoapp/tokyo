import { Channel, createLocalSource } from '@tokyo/client-api';
import { LibraryMessage } from '@tokyo/proto';
import { createEffect, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';

export function locationsAccessor() {
  createEffect(() => {
    request();
  });

  const [store, setStore] = createStore<Array<LibraryMessage & { source_id: string }>>([]);

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
        ...chunk.data.map((entry: LibraryMessage) => {
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

  const request = () => {
    channel.send({
      type: 'locations',
    });
  };

  const create = (data: {
    path: string;
    name: string;
  }) => {
    channel.send({
      type: 'locations.mutate',
      path: data.path,
      name: data.name,
    });
  };

  return {
    request,
    create,
    store,
  };
}
