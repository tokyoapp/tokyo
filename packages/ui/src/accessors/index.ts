import { createEffect, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Channel, createLocalSource } from 'client-api';

export function indexAccessor(params: {
  locations: string[];
}) {
  createEffect(() => {
    request(params.locations);
  });

  const [list, setList] = createStore<{ value: number; source_id: string }[]>([]);

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
    setList(data.map((d) => d.data));
  });

  onCleanup(() => {
    currentSub();
  });

  const request = (locations: string[]) => {
    // place where the request message is created
    channel.send({
      type: 'index',
      locations,
    });
  };

  return {
    request,
    data: list,
  };
}
