import { createSignal, onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import storage from '../services/ClientStorage.worker';
import { DynamicImage } from '../DynamicImage.ts';
import library, { type Location } from '../services/LibraryLocation.worker';
import Action from '../actions/Action.ts';
import Rating from './Rating.tsx';
import Combobox from './Combobox.tsx';
import FilterCombobox from './FilterCombobox.tsx';
import { Stars } from './Stars.tsx';
import Icon from './Icon.tsx';

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

  const [starFilter, setStarFilter] = createSignal(0);

  function itemFilter(item: Entry) {
    if (starFilter() && item.meta.rating < starFilter()) {
      return false;
    }
    return true;
  }

  const [sorting, setSorting] = createSignal<keyof typeof sort>('created');
  const items = () => [...props.location.entries].sort(sort[sorting()]);

  const onKeyDown = (e: KeyboardEvent) => {
    const parent = (e.target as HTMLElement).parentNode;
    const children = [...(parent?.children || [])];

    switch (e.key) {
      case 'ArrowLeft':
        const prevChild = children[children.indexOf(e.target) - 1];
        prevChild.focus();
        prevChild.click();
        break;
      case 'ArrowRight':
        const nextChild = children[children.indexOf(e.target) + 1];
        nextChild.focus();
        nextChild.click();
        break;
    }
  };

  return (
    <div class="grid grid-rows-[auto_1fr] overflow-auto h-full bg-[#27272A]" onKeyDown={onKeyDown}>
      <nav class="pb-2 bg-[#18191B]">
        <div class="px-1 py-2 border-b-zinc-800 border-b text-sm flex justify-between items-center">
          <div class="">
            <Combobox
              title="Sort"
              onInput={(values) => {
                const value = values[0];
                if (value in sort) setSorting(value);
              }}
              items={[
                { id: 'created', value: 'Created', checked: sorting() === 'created' },
                { id: 'rating', value: 'Rating', checked: sorting() === 'rating' },
              ]}
            >
              {`Sort by ${sorting()}`}
            </Combobox>
          </div>

          <div class="view-settings flex gap-3 items-center">
            {/* <FilterCombobox multiple title="Filter by Tags">
                <span>Tags</span>
            </FilterCombobox> */}

            <Stars value={starFilter()} onChange={(v) => setStarFilter(v)} />

            <Combobox
              multiple
              title="View settings"
              onInput={(value) => {
                setViewSettings({
                  showRating: value.includes('showRating'),
                  showName: value.includes('showName'),
                  showSettings: value.includes('showSettings'),
                });
              }}
              items={[
                { id: 'showRating', value: 'Rating', checked: viewSettings.showRating },
                { id: 'showName', value: 'Filename', checked: viewSettings.showName },
                { id: 'showSettings', value: 'Settings', checked: viewSettings.showSettings },
              ]}
            >
              <Icon name="more" />
            </Combobox>
          </div>
        </div>
      </nav>

      <div class="p-1 overflow-auto w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 break-all gap-2 overscroll-none">
        {items()
          .filter(itemFilter)
          .map(({ path, meta }, i) => {
            return (
              <Thumb
                number={(i + 1).toString()}
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
  number: string;
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
      const canvas = dynimg.resizeContain(256).canvas();
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
      library.thumbnail(id).then((thumb) => {
        useThumb(thumb);
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
      class={`h-52 px-2 relative overflow-hidden flex items-center justify-center
            bg-transparent bg-zinc-900 focus:bg-zinc-800 focus:border-gray-600
            border border-transparent shadow-none ${props.name ? 'pb-6' : 'pb-1'} ${
        props.settings ? 'pt-6' : 'pt-1'
      }`}
      onClick={() => props.onClick()}
      ref={ele}
    >
      <div class="relative z-30 w-full h-full flex items-center">{img()}</div>

      <div class="z-10 absolute top-1 right-1 opacity-5 text-7xl leading-none">{props.number}</div>

      <div class="z-40 absolute top-1 left-2 text-xs opacity-70">
        {props.settings ? (
          <span>{`${props.meta.exif.focal_length.split('/')[0]}mm F${
            props.meta.exif.fnumber.split('/')[0]
          } ISO${props.meta.exif.iso_speed_ratings} ${props.meta.exif.exposure_time}`}</span>
        ) : null}
      </div>
      <div class="z-40 absolute bottom-1 left-2 text-xs opacity-70">
        {props.rating ? (
          <div class="pb-1">
            <Rating rating={props.meta.rating} />
          </div>
        ) : null}
        {props.name ? props.meta.name : null}
      </div>
    </div>
  );
}
