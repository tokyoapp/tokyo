import "@sv/elements/dropdown";
import "@sv/elements/toggle";
import type { ParentProps } from "solid-js";
import Icon from "./Icon.jsx";

export default function Combobox(
  props: {
    title: string;
    value: string;
    class: string;
    multiple: boolean;
    onInput: (value: string[]) => void;
    items: { id: string; value: string; checked: boolean }[];
    content?: Element;
  } & ParentProps,
) {
  return (
    <a-dropdown
      class={`relative inline-block${props.class}`}
      style="--dropdown-speed: 0s"
      onInput={(e) => {
        if (e.target.value[0] !== "none") {
          props.onInput(e.target.value);
        }
      }}
    >
      <button
        title={props.title}
        type="button"
        slot="input"
        class="rounded-md bg-zinc-800 px-2 py-1 text-left shadow-none"
      >
        {props.children}
      </button>

      <div class="mt-1 min-w-[150px] rounded-md border border-zinc-800 bg-zinc-800 p-1">
        <a-toggle
          multiple={props.multiple}
          value={props.items
            .map((item) => (item.checked ? item.id : false))
            .filter(Boolean)}
        >
          {props.items.map((item) => {
            return (
              <button
                type="button"
                value={item.id}
                class="group flex w-full items-center justify-start rounded-md bg-transparent px-2 py-1 shadow-none outline-none active:bg-zinc-800 hover:bg-zinc-700"
              >
                <div class="mr-2 ml-1 opacity-0 group-[&[selected]]:opacity-100">
                  <Icon name="check" />
                </div>
                <div>{item.value}</div>
              </button>
            );
          })}

          <div value="none">{props.content || null}</div>
        </a-toggle>
      </div>
    </a-dropdown>
  );
}
