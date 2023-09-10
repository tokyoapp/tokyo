import { Rive } from '@rive-app/canvas-single';
import { onCleanup } from 'solid-js';

const icons = {
  unknown: await import('../../assets/icons/unknown.svg?raw'),
  star: await import('../../assets/icons/star.svg?raw'),
  check: await import('../../assets/icons/check.svg?raw'),
  'chevron-right': await import('../../assets/icons/chevron-right.svg?raw'),
  close: await import('../../assets/icons/close.svg?raw'),
  cogwheel: await import('../../assets/icons/cogwheel.svg?raw'),
  'expand-down': await import('../../assets/icons/expand-down.svg?raw'),
  more: await import('../../assets/icons/more.svg?raw'),
  'smaller-equals': await import('../../assets/icons/smaller-equals.svg?raw'),
  text: await import('../../assets/icons/text.svg?raw'),
  loader: await import('../../assets/loader.riv?url'),
} as const;

// TODO: keep rive icons here too

type Props = {
  name?: keyof typeof icons;
  class?: string;
};

export default function Icon(props: Props) {
  const src = icons[props.name || 'unknown'].default;
  const className = `icon ${props.class}`;

  if (src.includes('.riv')) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;

    const riveInstance = new Rive({
      src: src,
      autoplay: true,
      canvas: canvas,
    });

    onCleanup(() => {
      riveInstance.cleanup();
    });

    return <div class={className}>{canvas}</div>;
  }

  return <div class={className} innerHTML={src} />;
}
