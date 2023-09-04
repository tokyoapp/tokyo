import { createSignal } from 'solid-js';
import { file } from '../actions/open.ts';
import { Loader } from './Loader.tsx';
import Rating from './Rating.tsx';

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
    <div class="grid grid-rows-[1fr_100px] w-full h-full items-center">
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">
        {loading() ? <Loader /> : null}
      </div>

      <div>{canvas}</div>

      <pre class="bg-zinc-900 p-2 w-full h-full box-content">
        <div class="my-1 mb-2">
          <Rating rating={file.metadata.rating || 0} />
        </div>
        <span>Speed {file.metadata?.exif?.exposure_time} </span>
        <span>F {file.metadata?.exif?.fnumber} </span>
        <span>ISO {file.metadata?.exif?.iso_speed_ratings} </span>
        <div>
          <span>Focal length {file.metadata?.exif?.focal_length} </span>
        </div>
      </pre>
    </div>
  );
}
