import { VirtualContainer } from '@minht11/solid-virtual-container';
import { IndexEntryMessage } from 'tokyo-proto';
import { For, createEffect, createSignal, on, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { createLocationsAccessor, createMetadataAccessor, createIndexAccessor } from 'tokyo-api';
import Jobs from '../actions/Action.ts';
import { t } from 'tokyo-locales';
import Combobox from './Combobox.tsx';
import Icon from './Icon.tsx';
import Rating from './Rating.tsx';
import { Stars } from './Stars.tsx';
import { useAccessor } from 'tokyo-accessors/src/adapters/solid.js';

export default function ExplorerView(props: {
  small: boolean;
}) {
  const indexAccessor = useAccessor(createIndexAccessor);
  const metadataAccessor = useAccessor(createMetadataAccessor);
  const locationsAccessor = useAccessor(createLocationsAccessor);

  locationsAccessor.params({
    query: {},
  });

  const [selectedLocations, setSelectedLocations] = createSignal<string[]>([]);

  createEffect(() => {
    indexAccessor.params({
      query: {
        locations: selectedLocations(),
      },
    });
    const locs = locationsAccessor.data() || [];
    if (selectedLocations().length === 0 && locs.length > 0) {
      setSelectedLocations([locs[0].id]);
    }
  });

  const [selection, setSelection] = createSignal<IndexEntryMessage[]>([]);

  function tags(entry: IndexEntryMessage) {
    const arr = entry.tags.filter(Boolean).map((tag) => {
      return [].find((t) => t.id === tag)?.name || tag;
    });
    return arr || [];
  }

  createEffect(() => {
    const entires = selection();
    if (entires[0]) openFile(entires[0]);
  });

  async function openFile(entry: IndexEntryMessage) {
    Jobs.run('open', [entry]);
  }

  createEffect(
    on(
      () => [...(locationsAccessor.data() || [])],
      () => {
        const locs = locationsAccessor.data() || [];
        if (selectedLocations().length === 0 && locs.length > 0) {
          if (locs[0]) setSelectedLocations([locs[0].id]);
        }
      }
    )
  );

  const rows = (width = 4) => {
    const rs = [];
    let currRow: any[] = [];
    // const items = indexAccessor.data().stacks[0];
    const items = [];
    for (const entry of items) {
      if (currRow.length < width) {
        currRow.push(entry);
      } else {
        rs.push(currRow);
        currRow = [];
        currRow.push(entry);
      }
    }
    rs.push(currRow);

    return rs;
  };

  createEffect(() => {
    if (props.small) {
      setTimeout(() => {
        const ele = document.querySelector('[data-selected]') as HTMLElement | undefined;
        if (ele) {
          ele.scrollIntoView({ inline: 'center', block: 'center' });
        }
      }, 100);
    }
  });

  const [viewSettings, setViewSettings] = createStore({
    showRating: true,
    showName: true,
    showTags: false,
  });

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

  let scrollTargetElement!: HTMLDivElement;

  const image = (id: string) => {
    return metadataAccessor.data()?.find((item) => item.id === id)?.thumbnail;
  };

  return (
    <div
      class="@container bg-[#111] relative grid grid-rows-[auto_1fr] overflow-auto h-full"
      onKeyDown={onKeyDown}
    >
      <nav class="bg-[#111]">
        <div class="px-2 py-2 box-content h-[34px] text-xs flex justify-between items-center">
          <div class="flex gap-2 ">
            <Combobox
              multiple
              class="px-1 pointer-events-auto hidden @5xl:block"
              items={
                locationsAccessor.data()?.map((lib) => {
                  return {
                    id: lib.id,
                    value: `${lib.name}`,
                    get checked() {
                      return selectedLocations().includes(lib.id);
                    },
                  };
                }) || []
              }
              title={'Library'}
              onInput={(values) => {
                setSelectedLocations(values);
              }}
              content={
                <div>
                  <hr class="my-2" />
                  <button
                    type="button"
                    onMouseUp={(e) => {
                      e.stopImmediatePropagation();
                      e.stopPropagation();
                      e.preventDefault();
                      Jobs.run('create', [locationsAccessor.data()]);
                    }}
                    class="px-2 py-1 w-full text-left shadow-none opacity-50 hover:opacity-100"
                  >
                    <Icon name="plus" class="mr-2" />
                    <span>Create new</span>
                  </button>
                </div>
              }
            >
              {selectedLocations().map((loc) => {
                return <span>{locationsAccessor.data()?.find((l) => l.id === loc)?.name}, </span>;
              })}
              <Icon class="pl-2" name="expand-down" />
            </Combobox>

            <Combobox
              title="Sort"
              multiple
              onInput={(values) => {
                indexAccessor.params({
                  sortCreated: values.includes('created'),
                  sortRating: values.includes('rating'),
                });
              }}
              items={[
                {
                  id: 'created',
                  value: t('explorer_sort_created'),
                  checked: indexAccessor.params()?.sortCreated || false,
                },
                {
                  id: 'rating',
                  value: t('explorer_sort_rating'),
                  checked: indexAccessor.params()?.sortRating || false,
                },
              ]}
            >
              <div class="flex items-center">
                <Icon name="ph-sort-ascending" class="mr-1" />
                <span>{t('explorer_sort_created')}</span>
              </div>
            </Combobox>
          </div>

          <div class="view-settings flex gap-3 items-center">
            {/* <FilterCombobox multiple title="Filter by Tags">
                <span>Tags</span>
            </FilterCombobox> */}

            <Stars
              value={indexAccessor.params()?.filterRating || 0}
              onChange={(v) =>
                indexAccessor.params({
                  filterRating: v === indexAccessor.params()?.filterRating ? 0 : v,
                })
              }
            />

            <Combobox
              title="View settings"
              multiple
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
        <div class="hidden @5xl:block">{/* <SystemInfo /> */}</div>

        <div class="pb-24 overscroll-none">
          <VirtualContainer
            scrollTarget={scrollTargetElement}
            itemSize={{ height: 208 }}
            overscan={2}
            items={rows(props.small ? 1 : 5)}
          >
            {(props: { index: number; style: string; item: IndexEntryMessage[][] }) => {
              return (
                <div style={props.style} class="w-full flex gap-1">
                  <For each={props.item}>
                    {(items, i) => {
                      return (
                        <Thumbnail
                          onMount={() => {
                            const ids = metadataAccessor.params()?.query?.ids || [];
                            const id = items[0].path;
                            if (!ids.includes(id)) {
                              metadataAccessor.params({
                                query: {
                                  ids: [...ids, items[0].path],
                                },
                              });
                            }
                          }}
                          class="flex-1 pb-1"
                          selected={selection().includes(items[0])}
                          number={(props.index * 4 + i() + 1).toString()}
                          name={viewSettings.showName}
                          tags={viewSettings.showTags ? tags(items[0]) : []}
                          rating={viewSettings.showRating ? items[0].rating : undefined}
                          image={image(items[0].path)}
                          onClick={() => {
                            setSelection(items);
                          }}
                          items={items}
                        />
                      );
                    }}
                  </For>
                </div>
              );
            }}
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
  rating?: number;
  tags: string[];
  number?: string;
  items: IndexEntryMessage[];
  image?: HTMLCanvasElement;
  class?: string;
  onClick: () => void;
  onMount: () => void;
};

function Thumbnail(props: ThumbProps) {
  onMount(() => {
    props.onMount?.();
  });

  return (
    <div class={`thumbnail z-0 relative h-52 overflow-hidden ${props.class || ''}`}>
      <div
        data-selected={props.selected || undefined}
        tabIndex={0}
        class={[
          `h-full bg-transparent focus:bg-zinc-800 focus:border-gray-600
          border shadow-none`,
          props.selected ? 'border-gray-600' : 'border-transparent',
        ].join(' ')}
        onClick={() => props.onClick()}
      >
        <div class="w-full h-full flex items-center justify-center">
          {props.image
            ? props.items.slice(0, 3).map((item, i) => {
                return (
                  <div
                    class={`thumbnail-image absolute top-0 left-0 w-full h-full flex items-center justify-center
                  ${i === 0 ? 'z-30 shadow-md' : ''}
                  ${i === 1 ? 'z-20 ml-2 mt-2' : ''}
                  ${i === 2 ? 'z-10 ml-4 mt-4' : ''}
                `}
                  >
                    {props.image}
                  </div>
                );
              })
            : null}
          {!props.image ? <Icon name="loader" class="text-4xl opacity-50" /> : null}
        </div>
      </div>

      <div class="z-40 absolute top-0 left-0 p-1 h-full w-full grid grid-rows-[1fr_auto_auto] gap-1 opacity-70 pointer-events-none">
        <div class="absolute text-7xl opacity-5 leading-none">{props.number}</div>

        <div class="text-xs">{props.name ? props.items[0].name : null}</div>

        <div class="flex flex-wrap justify-items-start items-start text-xs">
          {props.tags
            ? props.tags.map((tag) => <div class="rounded-md bg-zinc-700 p-[2px_6px]">{tag}</div>)
            : null}
        </div>

        <div class="text-xs">
          {props.rating ? (
            <div class="pb-1">
              <Rating rating={props.rating} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
