import { ParentProps } from 'solid-js';

const variants = {
  solid: `flex items-center
    min-h-[28px] px-2 py-1
    bg-[#27272A] border border-zinc-800
    pointer-events-auto`,
  square: `flex items-center justify-center p-1
    bg-[#27272A] border border-zinc-800
    pointer-events-auto w-9 h-9`,
  ghost: 'p-2 shadow-none',
} as const;

export default function (
  props: ParentProps & { onClick?: () => void; variant?: keyof typeof variants }
) {
  const style = props.variant ? variants[props.variant] || variants.solid : variants.solid;

  return (
    <button type="button" onClick={props.onClick} class={style}>
      {props.children}
    </button>
  );
}
