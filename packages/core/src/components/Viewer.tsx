import { ParentProps, createSignal, onMount } from 'solid-js';
import Icon from './Icon.tsx';
import { Entry, file } from '../Library.ts';
import { Stars } from './Stars.tsx';

export const [loading, setLoading] = createSignal(false);

const viewportCanvas = document.createElement('canvas');
viewportCanvas.id = 'viewport_canvas';

export const canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.maxHeight = 'calc(90vh - 100px)';
canvas.style.objectFit = 'contain';

const viewport = await import('viewport').then(async (module) => {
  await module.default();
  return module;
});

export async function loadImage(url: string, item: Entry) {
  setLoading(true);

  await viewport.init(viewportCanvas.id, url, {
    orientation: item.orientation,
  });

  setLoading(false);
}

const Tool = ({ children }: ParentProps) => {
  return (
    <div
      class="inline-flex h-8 justify-center items-center px-2 py-2 rounded-lg
            bg-black hover:bg-zinc-900 cursor-pointer"
    >
      {children}
    </div>
  );
};

export default function Preview() {
  const canvas = viewportCanvas;
  canvas.style.width = '100%';
  canvas.style.position = 'absolute';

  const resize = () => {
    const parent = canvas.parentNode as HTMLElement;
    canvas.width = parent?.clientWidth * 2;
    canvas.height = parent?.clientHeight * 2;
  };

  window.addEventListener('resize', resize);

  viewport.init(viewportCanvas.id, '', {
    orientation: 0,
  });

  onMount(() => {
    resize();
  });

  return (
    <div class="relative grid grid-rows-[1fr] w-full h-full items-center">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">
        {loading() ? <Icon name="loader" /> : null}
      </div>

      <div class="z-10 absolute top-2 left-3 w-auto right-3 flex gap-3">
        <Tool>
          <span>100%</span>
        </Tool>
        <Tool>
          <Icon name="ph-cursor" />
        </Tool>
      </div>

      <div class="z-10 absolute bottom-2 left-3 right-3 w-auto flex gap-3 justify-center items-center">
        <Stars value={file()?.rating || 0} />
      </div>

      {canvas}
    </div>
  );
}
