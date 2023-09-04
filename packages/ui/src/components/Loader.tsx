import { Rive } from '@rive-app/webgl-single';
import { onCleanup } from 'solid-js';
import anim from '../../assets/loader.riv?url';

export function Loader() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  canvas.style.width = '1em';
  canvas.style.height = '1em';

  const riveInstance = new Rive({
    src: anim,
    autoplay: true,
    canvas: canvas,
  });

  onCleanup(() => {
    riveInstance.cleanup();
  });

  return <div>{canvas}</div>;
}
