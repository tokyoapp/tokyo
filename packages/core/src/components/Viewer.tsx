import { ParentProps, createEffect, createSignal, onMount } from 'solid-js';
import Icon from './Icon.tsx';
import { Entry, file } from '../Library.ts';
import { Stars } from './Stars.tsx';

export const [item, setItem] = createSignal<{
  item: Entry;
  url: string;
}>();
export const [loading, setLoading] = createSignal(false);

export async function loadImage(url: string, item: Entry) {
  setLoading(true);
  setItem({
    item,
    url,
  });
}

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

const viewport = await import('viewport').then(async (module) => {
  await module.default();
  return module;
});

export default function Preview() {
  const viewportCanvas = document.createElement('canvas');
  viewportCanvas.id = 'viewport_canvas';
  viewportCanvas.style.width = '100%';
  viewportCanvas.style.position = 'absolute';

  const resize = () => {
    const parent = viewportCanvas.parentNode as HTMLElement;
    viewportCanvas.width = parent?.clientWidth * 2;
    viewportCanvas.height = parent?.clientHeight * 2;
  };

  window.addEventListener('resize', resize);

  let vp: ReturnType<typeof viewport.init>;
  try {
    vp = viewport.init();
    vp.start(viewportCanvas.id, '', {
      orientation: 0,
    });
  } catch (err) {
    console.error('Viewport Error: ', err);
  }

  createEffect(() => {
    if (vp) {
      vp.destroy();

      const i = item();
      if (i) {
        vp.start(viewportCanvas.id, i.url, {
          orientation: i.item.orientation,
        });
      }
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
        <Tool>
          <span>100%</span>
        </Tool>
        <Tool class="bg-zinc-900">
          <Icon class="text-base" name="ph-cursor" />
        </Tool>
      </div>

      <div class="z-20 absolute bottom-2 left-3 right-3 w-auto flex gap-3 justify-center items-center">
        <Stars value={file()?.rating || 0} />
      </div>

      <div class="relative z-10 w-full h-full">{viewportCanvas}</div>
    </div>
  );
}
