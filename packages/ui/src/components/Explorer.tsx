import { createVirtualList, VirtualList } from "@solid-primitives/virtual";
import {
  For,
  createEffect,
  createMemo,
  createSignal,
  on,
  onMount,
} from "solid-js";
import { createStore } from "solid-js/store";
import { useAccessor } from "tokyo-accessors/solid";
import {
  createIndexAccessor,
  createLocationsAccessor,
  createMetadataAccessor,
} from "tokyo-api";
import { t } from "tokyo-locales";
import type { IndexEntryMessage } from "tokyo-schema";
import Jobs from "../actions/Action.ts";
import Combobox from "./Combobox.jsx";
import Icon from "./Icon.jsx";
import { Rating, Stars } from "./Stars.jsx";
import "@sv/elements/box";

export function ExplorerView(props: { small?: boolean }) {
  const index = useAccessor(createIndexAccessor);
  const locations = useAccessor(createLocationsAccessor);

  onMount(() => {
    console.log("Query locations");
    locations.query({});
  });

  index.params({
    sortCreated: true,
    sortRating: false,
  });

  const [selectedLocations, setSelectedLocations] = createSignal<string[]>([]);

  createEffect(() => {
    console.log(selectedLocations());
    index.query({
      locations: selectedLocations(),
    });
  });

  createEffect(() => {
    const locs = locations.data() || [];

    console.log(locs);

    if (selectedLocations().length === 0 && locs.length > 0) {
      setSelectedLocations([locs[0].id]);
    }
  });

  const [selection, setSelection] = createSignal<IndexEntryMessage[]>([]);

  createEffect(() => {
    const entires = selection();
    if (entires[0]) openFile(entires[0]);
  });

  async function openFile(entry: IndexEntryMessage) {
    Jobs.run("open", [entry]);
  }

  createEffect(
    on(
      () => [...(locations.data()?.libraries || [])],
      () => {
        const locs = locations.data()?.libraries || [];
        if (selectedLocations().length === 0 && locs.length > 0) {
          if (locs[0]) setSelectedLocations([locs[0].id]);
        }
      },
    ),
  );

  const rows = createMemo(() => {
    const width = props.small ? 1 : 5;
    const rs = [];
    let currRow: IndexEntryMessage[][] = [];
    const items = index.data();

    if (items)
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
  });

  createEffect(() => {
    if (props.small) {
      setTimeout(() => {
        const ele = document.querySelector("[data-selected]") as
          | HTMLElement
          | undefined;
        if (ele) {
          ele.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
      case "ArrowLeft": {
        const prevChild = children[children.indexOf(e.target) - 1];
        prevChild.focus();
        prevChild.click();
        break;
      }
      case "ArrowRight": {
        const nextChild = children[children.indexOf(e.target) + 1];
        nextChild.focus();
        nextChild.click();
        break;
      }
    }
  };

  return (
    <div
      class="@container relative grid h-full grid-rows-[auto_1fr]  bg-[#111]"
      onKeyDown={onKeyDown}
    >
      <nav class="bg-[#111]">
        <div class="box-content flex h-[34px] items-center justify-between px-2 py-2 text-xs">
          <div class="flex gap-2">
            <Combobox
              multiple
              class="@5xl:block pointer-events-auto px-1"
              items={
                locations.data()?.libraries?.map((lib) => {
                  return {
                    id: lib.id,
                    value: `${lib.name}`,
                    get checked() {
                      return selectedLocations().includes(lib.id);
                    },
                  };
                }) || []
              }
              title={"Library"}
              onInput={(values) => {
                // setSelectedLocations(values);
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
                      Jobs.run("create", [locations.data()?.libraries]);
                    }}
                    class="w-full px-2 py-1 text-left opacity-50 shadow-none hover:opacity-100"
                  >
                    <Icon name="plus" class="mr-2" />
                    <span>Create new</span>
                  </button>
                </div>
              }
            >
              {selectedLocations().map((loc) => {
                return (
                  <span>
                    {
                      locations.data()?.libraries.find((l) => l.id === loc)
                        ?.name
                    }
                    ,{" "}
                  </span>
                );
              })}
              <Icon class="pl-2" name="expand-down" />
            </Combobox>

            <Combobox
              title="Sort"
              multiple
              onInput={(values) => {
                index.params({
                  sortCreated: values.includes("created"),
                  sortRating: values.includes("rating"),
                });
              }}
              items={[
                {
                  id: "created",
                  value: t("explorer_sort_created"),
                  checked: index.params()?.sortCreated || false,
                },
                {
                  id: "rating",
                  value: t("explorer_sort_rating"),
                  checked: index.params()?.sortRating || false,
                },
              ]}
            >
              <div class="flex items-center">
                <Icon name="ph-sort-ascending" class="mr-1" />
                <span>{t("explorer_sort_created")}</span>
              </div>
            </Combobox>
          </div>

          <div class="view-settings flex items-center gap-3">
            {/* <FilterCombobox multiple title="Filter by Tags">
                <span>Tags</span>
            </FilterCombobox> */}

            <Stars
              value={index.params()?.filterRating || 0}
              onChange={(v) =>
                index.params({
                  filterRating: v === index.params()?.filterRating ? 0 : v,
                })
              }
            />

            <Combobox
              title="View settings"
              multiple
              onInput={(value) => {
                setViewSettings({
                  showRating: value.includes("showRating"),
                  showName: value.includes("showName"),
                  showTags: value.includes("showTags"),
                });
              }}
              items={[
                {
                  id: "showRating",
                  value: t("explorer_view_rating"),
                  checked: viewSettings.showRating,
                },
                {
                  id: "showName",
                  value: t("explorer_view_filename"),
                  checked: viewSettings.showName,
                },
                {
                  id: "showTags",
                  value: t("explorer_view_tags"),
                  checked: viewSettings.showTags,
                },
              ]}
            >
              <Icon name="ph-eye" />
            </Combobox>
          </div>
        </div>
      </nav>

      <div class="relative w-full h-full">
        <ThumbnailRows
          items={rows()}
          viewSettings={viewSettings}
          selection={selection()}
          setSelection={setSelection}
        />
      </div>

      {selection().length > 0 ? (
        <div class="absolute bottom-3 left-3 right-3 z-40 w-auto">
          <div class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm">
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

function ThumbnailRows(props: {
  items: any[];
  viewSettings: any;
  selection: any;
  setSelection: () => void;
}) {
  const metadata = useAccessor(createMetadataAccessor);

  function tags(entry: IndexEntryMessage) {
    const arr = entry.tags.filter(Boolean).map((tag) => {
      return [].find((t) => t.id === tag)?.name || tag;
    });
    return arr || [];
  }

  const [rootHeight, setRootHeight] = createSignal(800);

  const virtualList = createMemo(() => {
    const [list, onScroll] = createVirtualList({
      // the list of items - can be a signal
      items: props.items,
      // the height of the root element of the virtualizedList - can be a signal
      rootHeight: rootHeight(),
      // the height of individual rows in the virtualizedList - can be a signal
      rowHeight: 208,
      // the number of elements to render both before and after the visible section of the list, so passing 5 will render 5 items before the list, and 5 items after. Defaults to 1, cannot be set to zero. This is necessary to hide the blank space around list items when scrolling - can be a signal
      overscanCount: 2,
    });

    return {
      list,
      onScroll,
    };
  });

  return (
    <a-box
      class="absolute inset-0"
      onResize={(e) => {
        setRootHeight(e.target.offsetHeight);
      }}
    >
      <div
        class="overflow-auto h-full overscroll-none"
        style={{
          height: `${rootHeight}px`,
        }}
        // outermost container must use onScroll
        onScroll={virtualList().onScroll}
      >
        <div
          class="relative w-full"
          style={{
            height: `${virtualList().list().containerHeight}px`,
          }}
        >
          <div
            class="absolute w-full"
            style={{
              // viewer element's top must be set to viewerTop()
              top: `${virtualList().list().viewerTop}px`,
            }}
          >
            <For fallback={"no items"} each={virtualList().list().visibleItems}>
              {(items, index) => (
                <div class="flex w-full gap-1 justify-start items-start">
                  <For each={items}>
                    {(items, i) => {
                      return (
                        <Thumbnail
                          onMount={() => {
                            const ids = metadata.query()?.ids || [];
                            const id = items[0].path;
                            if (!ids.includes(id)) {
                              metadata.query({
                                ids: [...ids, items[0].path],
                              });
                            }
                          }}
                          selected={props.selection.includes(items[0])}
                          number={(index() * 4 + i() + 1).toString()}
                          name={props.viewSettings.showName}
                          tags={
                            props.viewSettings.showTags ? tags(items[0]) : []
                          }
                          rating={
                            props.viewSettings.showRating
                              ? items[0].rating
                              : undefined
                          }
                          image={
                            metadata
                              .data()
                              ?.find((item) => item.hash === items[0].hash)
                              ?.thumbnail
                          }
                          onClick={() => {
                            props.setSelection(items);
                          }}
                          items={items}
                        />
                      );
                    }}
                  </For>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </a-box>
  );
}

function Thumbnail(props: {
  selected: boolean;
  name: boolean;
  rating?: number;
  tags: string[];
  number?: string;
  items: IndexEntryMessage[];
  image?: HTMLCanvasElement;
  onClick: () => void;
  onMount: () => void;
}) {
  onMount(() => {
    props.onMount?.();
  });

  return (
    <div class="thumbnail relative z-0 h-52 overflow-hidden flex-1">
      <div
        data-selected={props.selected || undefined}
        class={[
          "h-full border bg-transparent shadow-none focus:border-gray-600 focus:bg-zinc-800",
          props.selected ? "border-gray-600" : "border-transparent",
        ].join(" ")}
        onClick={() => props.onClick()}
      >
        <div class="flex h-full w-full items-center justify-center">
          {props.image
            ? props.items.slice(0, 3).map((item, i) => {
                return (
                  <div
                    class={`thumbnail-image absolute left-0 top-0 flex h-full w-full items-center justify-center ${
                      i === 0 ? "z-30 shadow-md" : ""
                    } ${i === 1 ? "z-20 ml-2 mt-2" : ""} ${
                      i === 2 ? "z-10 ml-4 mt-4" : ""
                    }`}
                  >
                    {props.image}
                  </div>
                );
              })
            : null}
          {!props.image ? (
            <Icon name="loader" class="text-4xl opacity-50" />
          ) : null}
        </div>
      </div>

      <div class="pointer-events-none absolute left-0 top-0 z-40 grid h-full w-full grid-rows-[1fr_auto_auto] gap-1 p-1 opacity-70">
        <div class="absolute text-7xl leading-none opacity-5">
          {props.number}
        </div>

        <div class="text-xs">{props.name ? props.items[0].name : null}</div>

        <div class="flex flex-wrap items-start justify-items-start text-xs">
          {props.tags
            ? props.tags.map((tag) => (
                <div class="rounded-md bg-zinc-700 p-[2px_6px]">{tag}</div>
              ))
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
