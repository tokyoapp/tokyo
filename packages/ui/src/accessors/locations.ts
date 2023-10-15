import { createEffect, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Channel, createLocalSource } from 'client-api';
import { LibraryMessage } from 'proto';

export function locationsAccessor() {
  createEffect(() => {
    request();
  });

  const [list, setList] = createStore<LibraryMessage[]>([]);

  const channel = new Channel();

  const [read, write] = createLocalSource();

  channel.connect(read, write);

  let data: any[] = [];

  const currentSub = channel.subscribe((chunk) => {
    if (chunk.data === null) {
      data = data.filter((entry) => {
        return entry.source_id !== chunk.source_id;
      });
    } else {
      // there can be duplicate items in these chunks, should dedupe them here.
      data.push(
        ...chunk.data.map((d) => ({
          data: d,
          source_id: chunk.source_id,
        }))
      );
    }
    setList(data.map((e) => e.data));
  });

  onCleanup(() => {
    currentSub();
  });

  const request = () => {
    // place where the request message is created
    channel.send({
      type: 'locations',
    });
  };

  return {
    request,
    data: list,
  };
}
