import '@atrium-ui/mono/dropdown';
import '@atrium-ui/mono/toggle';
import Icon from './Icon.tsx';
import { ParentProps } from 'solid-js';

export default function Select(
  props: {
    title: string;
    value: string;
    class: string;
    multiple: boolean;
    onChange: (value: string[]) => void;
    items: { id: string; value: string }[];
    content?: Element;
  } & ParentProps
) {
  return (
    <a-dropdown
      class={`relative inline-block ${props.class}`}
      style="--dropdown-speed: 0s"
      onSelect={(e) => {
        props.onChange(e.option.value);
      }}
    >
      <button
        title={props.title}
        type="button"
        slot="input"
        class="cursor-pointer bg-zinc-800 rounded-md px-2 py-1 text-left shadow-none"
      >
        {props.children}
      </button>

      <div class="rounded-md bg-zinc-800 border border-zinc-800 p-1 mt-1 min-w-[150px]">
        {props.items.map((item) => {
          return (
            <a-option
              type="button"
              value={item.id}
              class="outline-none group cursor-pointer w-full flex items-center justify-start px-2 py-1 shadow-none
                    rounded-md bg-transparent hover:bg-zinc-700 active:bg-zinc-800"
            >
              <div class="opacity-0 group-[&[selected]]:opacity-100 ml-1 mr-2">
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
