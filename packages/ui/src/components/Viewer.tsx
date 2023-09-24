import { ParentProps, createEffect, createSignal, onMount } from 'solid-js';
import { DynamicImage } from '../DynamicImage.ts';
import { Library, file, setFile } from '../Library.ts';
import storage from '../services/ClientStorage.worker';
import Button from './Button.tsx';
import Icon from './Icon.tsx';
import { Stars } from './Stars.tsx';
import { Notifications } from './notifications/Notifications.ts';
import { ErrorNotification } from './notifications/index.ts';
import { settings } from './Edit.tsx';
import { IndexEntryMessage } from 'proto';
import * as wasmViewport from '../lib.rs';
import type * as Viewport from '.rust/core.d.ts';

const viewport = wasmViewport as {
  default: () => Promise<void>;
  init: () => Promise<Viewport.WebHandle>;
};

const [item, setItem] = createSignal<{
  item: IndexEntryMessage;
  url: string;
}>();
const [loading, setLoading] = createSignal(false);

let controller: AbortController;
let timeout: number;

createEffect(() => {
  const setts = settings();
});

createEffect(async () => {
  // loadImage(`http://127.0.0.1:8000/api/local/thumbnail?file=${id}`, metadata);
  const _item = file();

  clearTimeout(timeout);

  if (controller) controller.abort();

  controller = new AbortController();

  if (_item && _item.hash !== item()?.item.hash) {
    const meta = await Library.metadata(_item.path);

    setLoading(true);

    const tmp = await storage.readTemp(_item.hash);

    const prevImg = new Image();
    prevImg.onload = () => {
      const img = new DynamicImage(prevImg, meta.metadata);

      img
        .resizeContain(1024)
        .canvas()
        .toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setLoading(true);
            setItem({
              item: _item,
              url,
            });
          }
        });
    };

    if (tmp && tmp.size > 0) {
      prevImg.src = URL.createObjectURL(tmp);
    } else {
      const thumb = new Blob([meta.metadata?.thumbnail]);
      prevImg.src = URL.createObjectURL(thumb);
    }
  }
});

const Tool = (props: ParentProps & { class: string }) => {
  return (
    <div
      class={`inline-flex h-8 justify-center items-center px-2 py-2 rounded-lg
            bg-black hover:bg-zinc-900 cursor-pointer ${props.class}`}
    >
      {props.children}
    </div>
  );
};

const viewportCanvas = document.createElement('canvas');
viewportCanvas.id = 'viewport_canvas';
viewportCanvas.style.width = '100%';
viewportCanvas.style.position = 'absolute';

export default function Preview() {
  const resize = () => {
    const parent = viewportCanvas.parentNode as HTMLElement;
    viewportCanvas.width = parent?.clientWidth * 2;
    viewportCanvas.height = parent?.clientHeight * 2;
  };

  window.addEventListener('resize', resize);

  let vp: Viewport.WebHandle;

  viewport
    .default()
    .then(async () => {
      const handle = await viewport.init();
      vp = handle;
      return handle;
    })
    .catch((err) => {
      console.error('Viewport Error: ', err);
      Notifications.push(
        new ErrorNotification({
          message: `Error: ${err.message}`,
          time: 3000,
        })
      );
    });

  createEffect(() => {
    const edit = settings();
    if (vp) {
      vp.apply_edit(edit);
    }
  });

  createEffect(() => {
    const i = item();

    if (vp && i) {
      vp.destroy();
      vp.start(viewportCanvas.id, i.url, {
        orientation: i.item.orientation,
      });
    }
    setLoading(false);
  });

  onMount(() => {
    resize();
  });

  return (
    <div class="relative z-0 grid grid-rows-[1fr] w-full h-full items-center">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">
        {loading() ? <Icon name="loader" /> : null}
      </div>

      <div class="z-20 absolute top-2 left-3 w-auto right-3 flex gap-3 text-xs">
        <Button
          variant="ghost"
          onClick={() => {
            setFile(undefined);
          }}
        >
          <div class="flex items-center">
            <Icon name="ph-arrow-left" class="mr-2 text-md" />
            <span>Back</span>
          </div>
        </Button>
        <Tool>
          <span>100%</span>
        </Tool>
        <Tool class="bg-zinc-900">
          <Icon class="text-base" name="ph-cursor" />
        </Tool>
      </div>

      <div class="z-20 absolute bottom-2 left-3 right-3 w-auto flex gap-3 justify-center items-center">
        <Stars
          value={file()?.rating || 0}
          onChange={(value) => {
            const f = file()?.hash;
            if (f) {
              Library.postMetadata(f, {
                rating: value,
              });
            }
          }}
        />
      </div>

      <div class="relative z-10 w-full h-full">{viewportCanvas}</div>
    </div>
  );
}
