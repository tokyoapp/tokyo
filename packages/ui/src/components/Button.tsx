import type { ParentProps } from "solid-js";
import { twMerge } from "tailwind-merge";

const variants = {
  solid: twMerge(
    `flex items-center`,
    `min-h-[28px] px-2 py-1`,
    `bg-[#27272A] border border-zinc-800`,
    `pointer-events-auto`
  ),
  square: `flex items-center justify-center p-1
    bg-[#27272A] border border-zinc-800
    pointer-events-auto w-9 h-9`,
  ghost: "p-2 shadow-none",
} as const;

export default function (
  props: ParentProps & {
    onClick?: () => void;
    variant?: keyof typeof variants;
    label: string;
  }
) {
  const style = props.variant
    ? variants[props.variant] || variants.solid
    : variants.solid;

  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={props.label}
      class={`tooltip${style}`}
    >
      {props.children}
    </button>
  );
}
