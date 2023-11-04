import { Signal, createEffect, on, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Channel, createLocalSource } from 'client-api';
import { DynamicImage } from '../image/DynamicImage';
import { MetadataMessage } from 'proto';

// TODO: AbortController
export function metadataAccessor(params: {
  ids: Signal<string[]>;
}) {
  const [list, setList] = createStore<{ value: number; source_id: string }[]>([]);

  createEffect(
    on(params.ids[0], (ids) => {
      const cache = list;
      for (let i = 0; i < ids.length; i += 2) {
        request(ids.slice(i, i + 2).filter((id) => !cache.find((entry) => entry.id === id)));
      }
    })
  );

  const channel = new Channel();

  const [read, write] = createLocalSource();

  channel.connect(read, write);

  const currentSub = channel.subscribe(async (chunk) => {
    if (chunk.data === null) {
      setList(
        list.filter((entry) => {
          return entry.source_id !== chunk.source_id;
        })
      );
    } else {
      // TODO: there can be duplicate items in these chunks, should dedupe them here.
      const items = await Promise.all(
        chunk.data.map(async (entry) => {
          const buff = new Uint8Array(entry.metadata.thumbnail);
          const blob = new Blob([buff]);
          return {
            ...entry.metadata,
            thumbnail: await makeThumbnail(blob, entry.metadata),
            id: entry.id,
            source_id: chunk.source_id,
          };
        })
      );
      const newList = [...list, ...items];
      setList(newList.filter((item) => newList.find((i) => i.id === item.id)));
    }
  });

  onCleanup(() => {
    currentSub();
  });

  const loadImage = (src: string): Promise<Image> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve(image);
        image.onload = null;
      };
      image.onerror = (err) => {
        reject('Error loading image');
      };
      image.src = src;
    });
  };

  const makeThumbnail = async (blob: Blob, meta: MetadataMessage) => {
    const dynimg = new DynamicImage();
    const url = URL.createObjectURL(blob);
    const image = await loadImage(url);
    dynimg.fromDrawable(image, meta).resizeContain(1025);
    const canvas = dynimg.canvas();
    return canvas;
  };

  const request = (ids: string[]) => {
    channel.send({
      type: 'metadata',
      ids,
    });
  };

  return {
    request,
    params,
    store: list,
  };
}
