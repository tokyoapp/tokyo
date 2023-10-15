import { createEffect, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Channel } from 'client-api';

export function locationsAccessor(params: { id: string }) {
  createEffect(() => {
    if (params.id)
      request({
        id: params.id,
      });
  });

  const [list, setList] = createStore<{ value: number; source_id: string }[]>([]);

  const channel = new Channel();

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
          value: d.value,
          source_id: chunk.source_id,
        }))
      );
    }
    setList(data.sort((a, b) => a.value - b.value));
  });

  onCleanup(() => {
    currentSub();
  });

  const request = (params: { id: string | undefined }) => {
    channel.send({
      id: params.id,
    });
  };

  return {
    request,
    data: list,
  };
}
