import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import storage from '../services/ClientStorage.worker';
import { DynamicImage } from '../DynamicImage.ts';
import library from '../services/LibraryLocation.worker';
import { type Location, type Entry, file } from '../Library.ts';
import Action from '../actions/Action.ts';
import Rating from './Rating.tsx';
import Combobox from './Combobox.tsx';
import FilterCombobox from './FilterCombobox.tsx';
import { Stars } from './Stars.tsx';
import Icon from './Icon.tsx';

const sort = {
  rating: (a: Entry, b: Entry) => {
    return +b.rating - +a.rating;
  },
  created: (a: Entry, b: Entry) => {
    const dateASlice = a.createDate.split(' ');
    dateASlice[0] = dateASlice[0].replaceAll(':', '-');
    const dateA = new Date(dateASlice.join(' '));

    const dateBSlice = b.createDate.split(' ');
    dateBSlice[0] = dateBSlice[0].replaceAll(':', '-');
    const dateB = new Date(dateBSlice.join(' '));

    return dateA.valueOf() - dateB.valueOf();
  },
};

export const [selection, setSelection] = createSignal<Entry[]>([]);

createEffect(() => {
  const [selected] = selection();
  if (selected) {
    Action.run('open', [selected]);
  }
});

createEffect(() => {
  if (file()) {
    setTimeout(() => {
      const ele = document.querySelector('[data-selected]') as HTMLElement | undefined;
      if (ele) {
        ele.scrollIntoView({ inline: 'center', block: 'center' });
      }
    }, 100);
  }
});

export default function Library(props: { location: Location }) {
  const [viewSettings, setViewSettings] = createStore({
    showRating: true,
    showName: false,
  });

  const [starFilter, setStarFilter] = createSignal(0);

  function itemFilter(item: Entry) {
    if (starFilter() && item.rating < starFilter()) {
      return false;
    }
    return true;
  }

  const [sorting, setSorting] = createSignal<keyof typeof sort>('created');
  const items = () => [...props.location.index].sort(sort[sorting()]);

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
    <div
      class="@container relative grid grid-rows-[auto_1fr] overflow-auto h-full bg-transparent"
      onKeyDown={onKeyDown}
    >
      <nav class="bg-[#111]">
        <div class="px-2 py-2 text-xs flex justify-between items-center">
          <div>
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
              <div class="flex items-center">
                <Icon name="ph-sort-ascending" class="mr-1" />
                <span>{sorting()}</span>
              </div>
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
                });
              }}
              items={[
                { id: 'showRating', value: 'Rating', checked: viewSettings.showRating },
                { id: 'showName', value: 'Filename', checked: viewSettings.showName },
              ]}
            >
              <Icon name="ph-eye" />
            </Combobox>
          </div>
        </div>
      </nav>

      <div class="p-1 overflow-auto w-full grid content-start break-all gap-1 overscroll-none grid-cols-1 @md:grid-cols-2 @5xl:grid-cols-4 @7xl:grid-cols-5">
        {items()
          .filter(itemFilter)
          .map((item, i) => {
            return (
              <Thumb
                selected={selection().includes(item)}
                number={(i + 1).toString()}
                name={viewSettings.showName}
                rating={viewSettings.showRating}
                onClick={() => {
                  setSelection([item]);
                }}
                item={item}
              />
            );
          })}
      </div>

      {selection().length > 0 ? (
        <div class="z-40 absolute bottom-3 left-3 right-3 w-auto">
          <div class="bg-zinc-900 px-3 py-1 border-zinc-800 border rounded-md text-sm">
            <span class="text-zinc-700">{selection()[0].name}</span>
            <span class="px-2" />
            <button type="button" class="p-1 px-2">
              <Icon name="close" />
            </button>
            <span class="px-2" />
            <button type="button" class="p-1 px-2">
              <Icon name="close" />
            </button>
            <span class="px-2" />
            <button type="button" class="p-1 px-2">
              <Icon name="close" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type ThumbProps = {
  selected: boolean;
  name: boolean;
  rating: boolean;
  number: string;
  item: Entry;
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
      const dynimg = new DynamicImage(image, props.item);
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

    const tmp = await storage.readTemp(props.item.hash);

    if (tmp && tmp.size > 0) {
      useThumb(tmp);
    } else {
      library.getMetadata(props.item.path).then((meta) => {
        const blob = new Blob([meta.metadata?.thumbnail]);
        useThumb(blob);
      });
      // get thumbnail from metadata data
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
    <div class="relative h-52">
      <div
        title={props.item.path}
        data-selected={props.selected || undefined}
        tabIndex={0}
        class={[
          `h-full bg-transparent bg-zinc-900 focus:bg-zinc-800 focus:border-gray-600
          border shadow-none`,
          props.selected ? 'border-gray-600' : 'border-transparent',
        ].join(' ')}
        onClick={() => props.onClick()}
        ref={ele}
      >
        <div class="w-full h-full flex items-center">{img()}</div>
      </div>

      <div class="z-1 absolute top-0 left-0 p-1 h-full w-full grid grid-rows-[auto_1fr_auto] opacity-70 pointer-events-none">
        <div class="absolute text-7xl opacity-5 leading-none">{props.number}</div>

        <div class="text-xs">{props.name ? props.item.name : null}</div>
        <span />
        <div class="text-xs">
          {props.rating ? (
            <div class="pb-1">
              <Rating rating={props.item.rating} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
