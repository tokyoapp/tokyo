import { createSignal, onMount } from 'solid-js';
import Icon from './Icon.tsx';
import { Meta } from '../Library.ts';

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

export async function loadImage(url: string, meta: Meta) {
  setLoading(true);

  await viewport.init(viewportCanvas.id, url, {
    orientation: meta.orientation,
  });

  setLoading(false);
}

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

  onMount(() => {
    resize();
  });

  return (
    <div class="relative grid grid-rows-[1fr] w-full h-full items-center">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">
        {loading() ? <Icon name="loader" /> : null}
      </div>

      {canvas}
    </div>
  );
}
