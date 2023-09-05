import { ParentProps } from 'solid-js';

export default function (props: ParentProps & { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class="flex items-center
        min-h-[28px] px-2 py-1
        bg-[#27272A] border border-[#2A2A2A]
        pointer-events-auto"
    >
      {props.children}
    </button>
  );
}
