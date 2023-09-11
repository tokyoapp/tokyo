import '@atrium-ui/mono/dropdown';
import '@atrium-ui/mono/toggle';
import Icon from './Icon.tsx';
import { ParentProps } from 'solid-js';

export default function Combobox(
  props: {
    title: string;
    value: string;
    multiple: boolean;
    onInput: (value: string[]) => void;
    items: { id: string; value: string; checked: boolean }[];
  } & ParentProps
) {
  return (
    <a-dropdown
      class="relative inline-block z-50"
      style="--dropdown-speed: 0s"
      onInput={(e) => props.onInput(e.target.value)}
    >
      <button
        title={props.title}
        type="button"
        slot="input"
        class="cursor-pointer rounded-lg px-2 py-1 text-left shadow-none"
      >
        {props.children}
      </button>

      <div class="rounded-md bg-zinc-800 border border-zinc-700 p-1 mt-1 min-w-[150px]">
        <a-toggle
          multiple={props.multiple}
          value={props.items.map((item) => (item.checked ? item.id : false)).filter(Boolean)}
        >
          {props.items.map((item) => {
            return (
              <button
                type="button"
                value={item.id}
                class="outline-none group cursor-pointer w-full flex items-center justify-start px-2 py-1 shadow-none
                    rounded-md bg-transparent hover:bg-zinc-600 active:bg-zinc-700"
              >
                <div class="opacity-0 group-[&[selected]]:opacity-100 ml-1 mr-2">
                  <Icon name="check" />
                </div>
                <div>{item.value}</div>
              </button>
            );
          })}
        </a-toggle>
      </div>
    </a-dropdown>
  );
}