import { createStore } from 'solid-js/store';
import { DynamicImage } from '../DynamicImage.ts';
import { drawToCanvas } from '../viewer.ts';

let controller: AbortController;

export const [file, setFile] = createStore({
  name: '',
  metadata: {},
});

export default async function open(p: string, metadata: any) {
  if (controller) controller.abort();

  controller = new AbortController();

  setFile({
    name: p,
    metadata: metadata,
  });

  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  const meta: {
    width: number;
    height: number;
    orientation: number;
  } = await fetch(`http://localhost:8000/metadata?file=${encodeURIComponent(p)}`).then((res) =>
    res.json()
  );

  const prevImg = new Image();
  prevImg.onload = () => {
    const img = new DynamicImage(prevImg, meta);
    drawToCanvas(img.canvas());
  };
  prevImg.src = `http://localhost:8000/thumbnail?file=${encodeURIComponent(p)}`;

  await fetch(`http://localhost:8000/open?file=${encodeURIComponent(p)}`, {
    signal: controller.signal,
  })
    .then(async (res) => new Uint8Array(await res.arrayBuffer()))
    .then((img: Uint8Array) => {
      const photo = DynamicImage.from(img, 5472, 3648, meta);
      drawToCanvas(photo.canvas());
    });
}
