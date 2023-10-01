import { createEffect, createSignal, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import storage from '../services/ClientStorage.worker';
import { DynamicImage } from '../DynamicImage.ts';
import { type Location, file, tags, Library } from '../Library.ts';
import Action from '../actions/Action.ts';
import Rating from './Rating.tsx';
import Combobox from './Combobox.tsx';
import FilterCombobox from './FilterCombobox.tsx';
import { Stars } from './Stars.tsx';
import Icon from './Icon.tsx';
import { SystemInfo } from './System.tsx';
import { IndexEntryMessage } from 'proto';
import { t } from '../locales/messages.ts';
import { VirtualContainer } from '@minht11/solid-virtual-container';

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

export default function Explorer(props: { location: Location }) {
  const [selection, setSelection] = createSignal<IndexEntryMessage[]>([]);

  createEffect(() => {
    const [selected] = selection();
    if (selected) {
      Action.run('open', [selected]);
    }
  });

  const sort = {
    rating: (a: IndexEntryMessage, b: IndexEntryMessage) => {
      return +b.rating - +a.rating;
    },
    created: (a: IndexEntryMessage, b: IndexEntryMessage) => {
      const dateASlice = a.createDate.split(' ');
      dateASlice[0] = dateASlice[0].replaceAll(':', '-');
      const dateA = new Date(dateASlice.join(' '));

      const dateBSlice = b.createDate.split(' ');
      dateBSlice[0] = dateBSlice[0].replaceAll(':', '-');
      const dateB = new Date(dateBSlice.join(' '));

      return dateA.valueOf() - dateB.valueOf();
    },
  };

  const [viewSettings, setViewSettings] = createStore({
    showRating: true,
    showName: false,
    showTags: false,
  });

  function stack(items: IndexEntryMessage[]) {
    const stacked = [];

    _stack: for (const item of items) {
      for (const stacked_item of stacked) {
        const _item = stacked_item[0];
        if (_item.hash === item.hash) {
          stacked_item.push(_item);
          continue _stack;
        }
      }
      stacked.push([item]);
    }

    return stacked;
  }

  const [starFilter, setStarFilter] = createSignal(0);

  function itemFilter(item: IndexEntryMessage) {
    if (starFilter() && item.rating < starFilter()) {
      return false;
    }
    return true;
  }

  const [sorting, setSorting] = createSignal<keyof typeof sort>('created');

  const rows = () => {
    const rs = [];
    let currRow: any[] = [];
    const items = stack(props.location.index.filter(itemFilter).sort(sort[sorting()]));
    for (const entry of items) {
      if (currRow.length < 4) {
        currRow.push(entry);
      } else {
        rs.push(currRow);
        currRow = [];
        currRow.push(entry);
      }
    }
    return rs;
  };

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

  const ListItem = (props) => {
    return (
      <div style={props.style} class="w-full flex gap-1">
        {props.item.map((items, i) => {
          return (
            <Thumbnail
              class="flex-1 pb-1"
              selected={selection().includes(items[0])}
              number={(props.index * 4 + i + 1).toString()}
              name={viewSettings.showName}
              tags={viewSettings.showTags}
              rating={viewSettings.showRating}
              onClick={() => {
                setSelection(items);
              }}
              items={items}
            />
          );
        })}
      </div>
    );
  };

  let scrollTargetElement!: HTMLDivElement;

  return (
    <div
      class="@container relative grid grid-rows-[auto_1fr] overflow-auto h-full bg-transparent"
      onKeyDown={onKeyDown}
    >
      <nav class="bg-[#111]">
        <div class="px-2 py-2 box-content h-[34px] text-xs flex justify-between items-center">
          <div>
            <Combobox
              title="Sort"
              onInput={(values) => {
                const value = values[0];
                if (value in sort) setSorting(value);
              }}
              items={[
                {
                  id: 'created',
                  value: t('explorer_sort_created'),
                  checked: sorting() === 'created',
                },
                { id: 'rating', value: t('explorer_sort_rating'), checked: sorting() === 'rating' },
              ]}
            >
              <div class="flex items-center">
                <Icon name="ph-sort-ascending" class="mr-1" />
                <span>{t('explorer_sort_' + sorting())}</span>
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
                  showTags: value.includes('showTags'),
                });
              }}
              items={[
                {
                  id: 'showRating',
                  value: t('explorer_view_rating'),
                  checked: viewSettings.showRating,
                },
                {
                  id: 'showName',
                  value: t('explorer_view_filename'),
                  checked: viewSettings.showName,
                },
                { id: 'showTags', value: t('explorer_view_tags'), checked: viewSettings.showTags },
              ]}
            >
              <Icon name="ph-eye" />
            </Combobox>
          </div>
        </div>
      </nav>

      <div class="p-1 overflow-auto w-full overscroll-none" ref={scrollTargetElement}>
        <div class="hidden @5xl:block">
          <SystemInfo />
        </div>

        <div class="pb-24 overscroll-none">
          <VirtualContainer
            scrollTarget={scrollTargetElement}
            itemSize={{ height: 208 }}
            overscan={2}
            items={rows()}
          >
            {ListItem}
          </VirtualContainer>
        </div>
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
  tags: boolean;
  number?: string;
  items: IndexEntryMessage[];
  class?: string;
  onClick: () => void;
};

function Thumbnail(props: ThumbProps) {
  const [img, setImg] = createSignal<Blob>();
  const [loaded, setLoaded] = createSignal(false);

  const useThumb = (blob?: Blob) => {
    const dynimg = new DynamicImage();
    const canvas = dynimg.canvas();

    if (blob) {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        dynimg.fromDrawable(image, props.items[0]).resizeContain(256);
        const newCanvas = dynimg.canvas();
        canvas.parentNode?.replaceChild(newCanvas, canvas);
        setLoaded(true);
      };
      image.onerror = (err) => {
        console.warn('Error loading thumbnail image', err);
      };
      image.src = url;
    }

    return canvas;
  };

  createEffect(async () => {
    const item = props.items[0];
    const tmp = await storage.readTemp(item.hash);

    setLoaded(false);
    if (tmp && tmp.size > 0) {
      setImg(tmp);
    } else {
      Library.metadata(item.path).then((meta) => {
        const data = new Uint8Array(meta.metadata?.thumbnail);
        const blob = new Blob([data]);
        setImg(blob);
      });
    }
  });

  const file_tags = () => {
    const arr = props.items[0].tags.filter(Boolean).map((tag) => {
      return tags().find((t) => t.id === tag)?.name || tag;
    });
    return arr || [];
  };

  return (
    <div class={`thumbnail z-0 relative h-52 overflow-hidden ${props.class || ''}`}>
      <div
        data-selected={props.selected || undefined}
        tabIndex={0}
        class={[
          `h-full bg-transparent bg-zinc-900 focus:bg-zinc-800 focus:border-gray-600
          border shadow-none`,
          props.selected ? 'border-gray-600' : 'border-transparent',
        ].join(' ')}
        onClick={() => props.onClick()}
      >
        <div class="w-full h-full flex items-center justify-center">
          {img()
            ? props.items.slice(0, 3).map((item, i) => {
                return (
                  <div
                    class={`thumbnail-image absolute top-0 left-0 w-full h-full flex items-center justify-center
                  ${i === 0 ? 'z-30 shadow-md' : ''}
                  ${i === 1 ? 'z-20 ml-2 mt-2' : ''}
                  ${i === 2 ? 'z-10 ml-4 mt-4' : ''}
                `}
                  >
                    {useThumb(img())}
                  </div>
                );
              })
            : null}
          {!loaded() ? <Icon name="loader" class="opacity-50" /> : null}
        </div>
      </div>

      <div class="z-40 absolute top-0 left-0 p-1 h-full w-full grid grid-rows-[auto_1fr_auto] opacity-70 pointer-events-none">
        <div class="absolute text-7xl opacity-5 leading-none">{props.number}</div>

        <div class="text-xs">{props.name ? props.items[0].name : null}</div>

        <div class="flex flex-wrap justify-items-start items-start text-xs">
          {props.tags
            ? file_tags().map((tag) => <div class="rounded-md bg-zinc-700 p-[2px_6px]">{tag}</div>)
            : null}
        </div>

        <div class="text-xs">
          {props.rating ? (
            <div class="pb-1">
              <Rating rating={props.items[0].rating} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
