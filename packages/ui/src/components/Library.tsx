import { createSignal, onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import storage from '../ClientStorage.worker';
import { DynamicImage } from '../DynamicImage.ts';
import type { Location } from '../Location.ts';
import Action from '../actions/Action.ts';
import Rating from './Rating.tsx';

type Entry = Location['entries'][number];
type Meta = Location['entries'][number]['meta'];

const sort = {
  rating: (a: Entry, b: Entry) => {
    return +b.meta.rating - +a.meta.rating;
  },
  created: (a: Entry, b: Entry) => {
    const dateASlice = a.meta.create_date.split(' ');
    dateASlice[0] = dateASlice[0].replaceAll(':', '-');
    const dateA = new Date(dateASlice.join(' '));

    const dateBSlice = b.meta.create_date.split(' ');
    dateBSlice[0] = dateBSlice[0].replaceAll(':', '-');
    const dateB = new Date(dateBSlice.join(' '));

    return dateA.valueOf() - dateB.valueOf();
  },
};

export default function Library(props: { location: Location }) {
  const [viewSettings, setViewSettings] = createStore({
    showRating: true,
    showName: true,
    showSettings: true,
  });

  const [sorting, setSorting] = createSignal<keyof typeof sort>('created');
  const items = () => [...props.location.entries].sort(sort[sorting()]);

  const onFilterChange = (value: keyof typeof sort) => {
    if (value in sort) setSorting(value);
  };

  const onViewStarsChange = (value: boolean) => {
    setViewSettings({
      showRating: value,
    });
  };

  const onViewSettingsChange = (value: boolean) => {
    setViewSettings({
      showSettings: value,
    });
  };

  const onViewNameChange = (value: boolean) => {
    setViewSettings({
      showName: value,
    });
  };

  return (
    <div class="grid grid-rows-[auto_1fr] overflow-auto h-full">
      <nav class="pb-2">
        <div class="px-1 py-2 border-b-zinc-700 border-b text-sm flex justify-between">
          <div class="flex gap-4 text-zinc-300 ">
            <div>{props.location.host ? new URL(props.location.host).host : null}</div>
            <span>{props.location.path}</span>
          </div>
          <div class="flex gap-4 text-zinc-300">
            <label>Rating</label>
            <input
              type="checkbox"
              checked={viewSettings.showRating}
              onChange={(e) => onViewStarsChange(e.target.checked)}
            />
            <label>Settings</label>
            <input
              type="checkbox"
              checked={viewSettings.showSettings}
              onChange={(e) => onViewSettingsChange(e.target.checked)}
            />
            <label>Name</label>
            <input
              type="checkbox"
              checked={viewSettings.showName}
              onChange={(e) => onViewNameChange(e.target.checked)}
            />
          </div>
        </div>
        <div class="px-1 py-2 border-b-zinc-700 border-b">
          <select class="bg-zinc-700" onChange={(e) => onFilterChange(e.target.value)}>
            <option value="created">Sort by created</option>
            <option value="rating">Sort by rating</option>
          </select>
        </div>
      </nav>

      <div class="overflow-auto w-full grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 break-all gap-2 overscroll-none">
        {items().map(({ path, meta }) => {
          return (
            <Thumb
              name={viewSettings.showName}
              settings={viewSettings.showSettings}
              rating={viewSettings.showRating}
              onClick={() => {
                Action.run('open', [path, meta]);
              }}
              src={path}
              meta={meta}
            />
          );
        })}
      </div>
    </div>
  );
}

type ThumbProps = {
  name: boolean;
  rating: boolean;
  settings: boolean;
  src: string;
  meta: Meta;
  onClick: () => void;
};

function Thumb(props: ThumbProps) {
  const [img, setImg] = createSignal<HTMLCanvasElement>();

  let ele: HTMLDivElement;

  let controller: AbortController;

  const useThumb = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const dynimg = new DynamicImage(image, props.meta);
      const canvas = dynimg.canvas();
      canvas.style.width = '100%';
      canvas.style.maxHeight = '100%';
      canvas.style.objectFit = 'contain';
      setImg(canvas);
    };
    image.src = url;
  };

  const onView = async () => {
    controller = new AbortController();

    const id = encodeURIComponent(props.src);
    const tmp = await storage.readTemp(id);

    if (tmp && tmp.size > 0) {
      useThumb(tmp);
    } else {
      fetch(`http://localhost:8000/thumbnail?file=${id}`, {
        signal: controller.signal,
      }).then(async (res) => {
        const buffer = await res.arrayBuffer();
        const blob = new Blob([buffer]);
        storage.writeTemp(id, await blob.arrayBuffer());
        useThumb(blob);
      });
    }
  };

  onMount(() => {
    const observer = new IntersectionObserver(
      (entires) => {
        if (!img()) {
          entires.forEach((entry) => {
            if (entry.isIntersecting) {
              onView();
            } else {
              if (controller) {
                controller.abort();
              }
            }
          });
        }
      },
      {
        rootMargin: '0px 400px',
      }
    );

    observer.observe(ele);

    onCleanup(() => {
      observer.disconnect();
    });
  });

  return (
    <div
      tabIndex={0}
      class="h-52 px-2 py-6 relative overflow-hidden flex items-center justify-center bg-transparent bg-zinc-900 focus:bg-zinc-800 focus:border-gray-600 border border-transparent shadow-none"
      onClick={() => props.onClick()}
      ref={ele}
    >
      {img()}

      <div class="absolute top-1 left-2 text-xs opacity-70">
        {props.settings ? (
          <span>{`${props.meta.exif.focal_length.split('/')[0]}mm F${
            props.meta.exif.fnumber.split('/')[0]
          } ISO${props.meta.exif.iso_speed_ratings} ${props.meta.exif.exposure_time}`}</span>
        ) : null}
      </div>
      <div class="absolute bottom-1 left-2 text-xs opacity-70">
        {props.rating ? <Rating rating={props.meta.rating} /> : null}
        {props.name ? props.meta.name : null}
      </div>
    </div>
  );
}
