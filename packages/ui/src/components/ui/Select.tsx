import "@atrium-ui/elements/dropdown";
import "@atrium-ui/elements/toggle";
import type { ParentProps } from "solid-js";
import Icon from "../ui/Icon.jsx";

export default function Select(
  props: {
    title: string;
    value: string;
    class: string;
    multiple: boolean;
    onChange: (value: string[]) => void;
    items: { id: string; value: string }[];
    content?: Element;
  } & ParentProps,
) {
  return (
    <a-dropdown
      class={`relative inline-block${props.class}`}
      style="--dropdown-speed: 0s"
      onSelect={(e) => {
        props.onChange(e.option.value);
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
        {props.items.map((item) => {
          return (
            <a-option
              type="button"
              value={item.id}
              class="group flex w-full items-center justify-start rounded-md bg-transparent px-2 py-1 shadow-none outline-hidden active:bg-zinc-800 hover:bg-zinc-700"
            >
              <div class="mr-2 ml-1 opacity-0 group-[&[selected]]:opacity-100">
                <Icon name="check" />
              </div>
              <div>{item.value}</div>
            </a-option>
          );
        })}
      </div>
    </a-dropdown>
  );
}
