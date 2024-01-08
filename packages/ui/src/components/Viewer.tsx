import { ParentProps, createEffect, createSignal, on, onMount } from 'solid-js';
import { DynamicImage } from 'tokyo-api/src/DynamicImage.ts';
import Button from './ui/Button.jsx';
import Icon from './ui/Icon.jsx';
import { Stars } from './ui/Stars.jsx';
import { t } from 'tokyo-locales';
import { createImageAccessor, createMetadataAccessor } from 'tokyo-api';
import { useAccessor } from 'tokyo-accessors/solid';
import { Model, PropertyModel } from 'tokyo-properties';

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

export default function Preview(props: {
  file: any;
  models: Record<string, PropertyModel>;
  onClose?: () => void;
}) {
  const [loading, setLoading] = createSignal(true);

  let timeout: number;

  const resize = () => {
    const parent = viewportCanvas.parentNode as HTMLElement;
    viewportCanvas.width = parent?.clientWidth * 2;
    viewportCanvas.height = parent?.clientHeight * 2;
  };

  const metadata = useAccessor(createMetadataAccessor);
  const image = useAccessor(createImageAccessor);

  const [edits, setEdits] = createSignal();

  const renderImage = (image: { width: number; height: number; image: Uint8Array }) => {
    if (!image) return;

    const img = new DynamicImage();
    console.log(image);
    img.fromRaw(image.image, image.width, image.height);

    const v = document.querySelector('#viewport');
    // biome-ignore lint/complexity/noForEach: <explanation>
    v?.childNodes.forEach((node) => node.remove());
    v?.appendChild(img.canvas());

    setLoading(false);
  };

  createEffect(async () => {
    const _item = props.file;

    clearTimeout(timeout);

    metadata.query({
      ids: [_item.path],
    });
    image.query({
      file: _item.path,
      edits: JSON.stringify(edits()),
    });

    window.addEventListener('resize', resize);
  });

  Model.stream(props.models.basic).pipeTo(
    new WritableStream({
      async write(c) {
        const values = Model.serialize(c);

        setEdits({
          exposure: 0.0,
          contrast: 0.0,
          temperature: 0.0,
          tint: 0.0,
          highlights: 0.0,
          shadows: 0.0,
          blacks: 0.0,
          whites: 0.0,
          vibrancy: 0.0,
          saturation: 0.0,
          texture: 0.0,
          curve_tone: [],
          curve_red: [],
          curve_green: [],
          curve_blue: [],

          ...values,
        });

        return new Promise((res) => {
          const int = setInterval(() => {
            if (!image.pending()) {
              clearInterval(int);
              res();
            }
          }, 100);
        });
      },
    })
  );

  createEffect(() => {
    renderImage(image.data());
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
              /*
              metadata.mutate(f, {
                rating: value,
              });
              */
            }
          }}
        />
      </div>

      <div class="relative z-10 w-full h-full flex justify-center items-center" id="viewport">
        {viewportCanvas}
      </div>
    </div>
  );
}
