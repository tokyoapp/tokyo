import "@phosphor-icons/web/light";
import { Rive } from "@rive-app/canvas-single";
import { onCleanup } from "solid-js";

const icons = {
  unknown: await import("../../../assets/icons/unknown.svg?raw"),
  star: await import("../../../assets/icons/star.svg?raw"),
  check: await import("../../../assets/icons/check.svg?raw"),
  "chevron-right": await import("../../../assets/icons/chevron-right.svg?raw"),
  close: await import("../../../assets/icons/close.svg?raw"),
  cogwheel: await import("../../../assets/icons/cogwheel.svg?raw"),
  "expand-down": await import("../../../assets/icons/expand-down.svg?raw"),
  more: await import("../../../assets/icons/more.svg?raw"),
  "smaller-equals": await import("../../../assets/icons/smaller-equals.svg?raw"),
  text: await import("../../../assets/icons/text.svg?raw"),
  plus: await import("../../../assets/icons/plus.svg?raw"),
  loader: await import("../../../assets/icons/loader.riv?url"),
} as const;

type Props = {
  name?: keyof typeof icons;
  class?: string;
};

const cache = new Map<string, ArrayBuffer>();

async function cachedRiveIcon(src: string): Promise<ArrayBuffer | undefined> {
  if (cache.has(src)) {
    return cache.get(src);
  }
  return fetch(src)
    .then((res) => res.arrayBuffer())
    .then((buffer) => {
      cache.set(src, buffer);
      return buffer;
    });
}

export default function Icon(props: Props) {
  // @ts-ignore
  const src = icons[props.name || "unknown"]?.default;
  const className = `icon ${props.class}`;

  if (props.name?.startsWith("ph-")) {
    return <i class={`ph-light inline-block align-baseline${props.name}${className}`} />;
  }

  if (src.includes(".riv")) {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;

    let riveInstance: Rive | undefined;

    cachedRiveIcon(src).then((buffer) => {
      riveInstance = new Rive({
        buffer: buffer,
        autoplay: true,
        canvas: canvas,
      });
    });

    onCleanup(() => {
      riveInstance?.cleanup();
    });

    return <div class={`inline-block align-baseline${className}`}>{canvas}</div>;
  }

  return <div class={`inline-block align-baseline${className}`} innerHTML={src} />;
}
