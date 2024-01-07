import '@atrium-ui/mono/dropdown';
import '@atrium-ui/mono/toggle';
import Icon from './Icon.jsx';
import { ParentProps } from 'solid-js';

export default function Combobox(
  props: {
    title: string;
    value: string;
    class: string;
    multiple: boolean;
    onInput: (value: string[]) => void;
    items: { id: string; value: string; checked: boolean }[];
    content?: Element;
  } & ParentProps
) {
  return (
    <a-dropdown
      class={`relative inline-block ${props.class}`}
      style="--dropdown-speed: 0s"
      onInput={(e) => {
        if (e.target.value[0] !== 'none') {
          props.onInput(e.target.value);
        }
      }}
    >
      <button
        title={props.title}
        type="button"
        slot="input"
        class=" bg-zinc-800 rounded-md px-2 py-1 text-left shadow-none"
      >
        {props.children}
      </button>

      <div class="rounded-md bg-zinc-800 border border-zinc-800 p-1 mt-1 min-w-[150px]">
        <a-toggle
          multiple={props.multiple}
          value={props.items.map((item) => (item.checked ? item.id : false)).filter(Boolean)}
        >
          {props.items.map((item) => {
            return (
              <button
                type="button"
                value={item.id}
                class="outline-none group  w-full flex items-center justify-start px-2 py-1 shadow-none
                    rounded-md bg-transparent hover:bg-zinc-700 active:bg-zinc-800"
              >
                <div class="opacity-0 group-[&[selected]]:opacity-100 ml-1 mr-2">
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
