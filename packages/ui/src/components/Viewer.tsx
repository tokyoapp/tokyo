import { createSignal } from 'solid-js';
import Icon from './Icon.tsx';

export const [loading, setLoading] = createSignal(false);

export const canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.maxHeight = 'calc(90vh - 100px)';
canvas.style.objectFit = 'contain';

export function drawToCanvas(photo: HTMLImageElement | HTMLCanvasElement) {
  const ctxt = canvas.getContext('2d');
  canvas.width = photo.width;
  canvas.height = photo.height;
  ctxt?.drawImage(photo, 0, 0);

  setLoading(false);
}

export default function Preview() {
  return (
    <div class="relative grid grid-rows-[1fr] w-full h-full items-center">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">
        {loading() ? <Icon name="loader" /> : null}
      </div>

      <div>{canvas}</div>
    </div>
  );
}
