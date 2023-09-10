import { createSignal } from 'solid-js';
import { file } from '../actions/open.ts';
import Icon from './Icon.tsx';
import Rating from './Rating.tsx';

export default function Preview() {
  return (
    <div class="bg-zinc-900 w-full h-full overflow-auto absolute text-xs">
      <pre class="p-2">
        <div class="my-1 mb-2">
          <Rating rating={file.metadata.rating || 0} />
        </div>
        <span>Speed {file.metadata?.exif?.exposure_time} </span>
        <span>F {file.metadata?.exif?.fnumber} </span>
        <span>ISO {file.metadata?.exif?.iso_speed_ratings} </span>
        <div>
          <span>Focal length {file.metadata?.exif?.focal_length} </span>
        </div>

        <div>
          <pre>{JSON.stringify(file.metadata, null, '  ')}</pre>
        </div>
      </pre>
    </div>
  );
}
