import { Signal, createEffect, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Channel, createLocalSource } from 'client-api';
import { DynamicImage } from '../image/DynamicImage';

export function metadataAccessor(params: {
  ids: Signal<string[]>;
}) {
  createEffect(() => {
    request(params.ids[0]());
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
    const files = data.map((d) => {
      const buff = new Uint8Array(d.data.metadata.thumbnail);
      const blob = new Blob([buff]);
      return { ...d.data.metadata, thumbnail: makeThumbnail(blob), id: d.data.id }
    });
    console.log(files)
    setList(files);
  });

  onCleanup(() => {
    currentSub();
  });

  const makeThumbnail = (blob?: Blob) => {
    const dynimg = new DynamicImage();
    const canvas = dynimg.canvas();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        dynimg.fromDrawable(image, {}).resizeContain(256);
        const newCanvas = dynimg.canvas();
        canvas.parentNode?.replaceChild(newCanvas, canvas);
      };
      image.onerror = (err) => {
        console.warn('Error loading thumbnail image', err);
      };
      image.src = url;
    }
    return canvas;
  };

  const request = (ids: string[]) => {
    // place where the request message is created
    console.log(ids);
    channel.send({
      type: 'metadata',
      ids,
    });
  };

  return {
    request,
    params,
    data: list,
  };
}
