import { ParentProps } from 'solid-js';

const variants = {
  solid: `flex items-center
  min-h-[28px] px-2 py-1
  bg-[#27272A] border border-[#2A2A2A]
  pointer-events-auto`,
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
