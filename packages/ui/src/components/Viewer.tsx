import { ParentProps, createEffect, createSignal, on, onMount } from 'solid-js';
import { DynamicImage } from '../image/DynamicImage.ts';
// import storage from '../services/ClientStorage.worker';
import Button from './Button.tsx';
import Icon from './Icon.tsx';
import { Stars } from './Stars.tsx';
import { Notifications } from './notifications/Notifications.ts';
import { ErrorNotification } from './notifications/index.ts';
import { settings } from './Edit.tsx';
import { IndexEntryMessage } from 'proto';
import * as viewport from 'viewport';
import { t } from '../locales/messages.ts';
import { metadataAccessor } from '../accessors/metadata.ts';
import { getImage } from 'tauri-plugin-library-api';

createEffect(() => {
  const setts = settings();
});

const [app, setApp] = createSignal({
  zoom: 1,
});

window.addEventListener('app:state', ((e: CustomEvent) => {
  setApp(e.detail);
}) as EventListener);

const Tool = (props: ParentProps & { class: string }) => {
  return (
    <div
      class={`inline-flex h-8 justify-center items-center px-2 py-2 rounded-lg
            bg-black hover:bg-zinc-900  ${props.class}`}
    >
      {props.children}
    </div>
  );
};

const viewportCanvas = document.createElement('canvas');
viewportCanvas.id = 'viewport_canvas';
viewportCanvas.style.width = '100%';
viewportCanvas.style.position = 'absolute';

export default function Preview(props: { file: any; onClose?: () => void }) {
  const [item, setItem] = createSignal<{
    item: IndexEntryMessage;
    url: string;
  }>();
  const [loading, setLoading] = createSignal(true);

  let controller: AbortController;
  let timeout: number;

  const resize = () => {
    const parent = viewportCanvas.parentNode as HTMLElement;
    viewportCanvas.width = parent?.clientWidth * 2;
    viewportCanvas.height = parent?.clientHeight * 2;
  };

  let vp: Viewport.WebHandle;

  createEffect(async () => {
    // loadImage(`http://127.0.0.1:8000/api/local/thumbnail?file=${id}`, metadata);
    const _item = props.file;

    clearTimeout(timeout);

    if (controller) controller.abort();

    controller = new AbortController();

    const metadata = metadataAccessor({ ids: createSignal<string[]>([]) });
    metadata.params.ids[1]([_item.path]);

    createEffect(() => {
      const edit = settings();
      if (vp) {
        vp.apply_edit(edit);
      }
    });

    createEffect(
      on(
        () => [...metadata.store],
        () => {
          const meta = metadata.store[0];
          if (meta) {
            console.log('Load', _item.path);

            getImage(_item.path).then((image) => {
              const img = new DynamicImage();
              img.fromRaw(image.data, image.width, image.height);

              if (meta.orientation)
                switch (meta.orientation) {
                  case 5:
                  case 6:
                    img.rotate90();
                    break;
                  case 7:
                  case 8:
                    img.rotate270();
                    break;
                }

              document.querySelector('#viewport')?.appendChild(img.canvas());
              setLoading(false);
            });

            // const img = new DynamicImage(meta.thumbnail, meta);
            // document.querySelector('#viewport')?.appendChild(img.canvas());

            // img
            //   .resizeContain(1024)
            //   .canvas()
            //   .toBlob((blob) => {
            //     if (blob) {
            //       const url = URL.createObjectURL(blob);

            //       console.log(url, vp);

            //       if (vp) {
            //         vp.destroy();
            //         vp.start(viewportCanvas.id, url, {
            //           orientation: _item.orientation,
            //         });
            //       }
            //       setLoading(false);
            //     }
            //   });
          }
        }
      )
    );

    window.addEventListener('resize', resize);

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
            props.onClose?.();
          }}
        >
          <div class="flex items-center">
            <Icon name="ph-arrow-left" class="mr-2 text-md" />
            <span>{t('viewer_back')}</span>
          </div>
        </Button>
        <Tool>
          <span>{Math.round(app().zoom * 100)}%</span>
        </Tool>
        <Tool class="bg-zinc-900">
          <Icon class="text-base" name="ph-cursor" />
        </Tool>
      </div>

      <div class="z-20 absolute bottom-2 left-3 right-3 w-auto flex gap-3 justify-center items-center">
        <Stars
          value={props.file?.rating || 0}
          onChange={(value) => {
            const f = props.file?.hash;
            if (f) {
              console.warn('not implemented');
              // Library.postMetadata(f, {
              //   rating: value,
              // });
            }
          }}
        />
      </div>

      <div class="relative z-10 w-full h-full" id="viewport">
        {viewportCanvas}
      </div>
    </div>
  );
}
