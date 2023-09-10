import { createStore } from 'solid-js/store';
import storage from '../services/ClientStorage.worker';
import library, { type Meta } from "../services/LibraryLocation.worker.ts";
import { DynamicImage } from '../DynamicImage.ts';
import { drawToCanvas, setLoading } from '../components/Viewer';

let controller: AbortController;

export const [file, setFile] = createStore({
  name: '',
  metadata: {},
});

let timeout: number;

export default async function open(p: string, metadata: Meta) {
  clearTimeout(timeout);

  if (controller) controller.abort();

  controller = new AbortController();

  setFile({
    name: p,
    metadata: metadata,
  });

  const id = encodeURIComponent(p);

  const meta = await library.metadata(id);

  setLoading(true);

  const tmp = await storage.readTemp(id);

  const prevImg = new Image();
  prevImg.onload = () => {
    const img = new DynamicImage(prevImg, meta);
    drawToCanvas(img.resizeContain(1024).canvas());
  };

  if (tmp && tmp.size > 0) {
    prevImg.src = URL.createObjectURL(tmp);
  }

  timeout = setTimeout(() => {
    console.log("hgello?");

    prevImg.onload = () => {
      drawToCanvas(new DynamicImage(prevImg, meta).canvas());
    };
    prevImg.src = `http://127.0.0.1:8000/api/local/thumbnail?file=${id}`;
  }, 250);

  // TODO: only get full image when needed
  // await fetch(`http://localhost:8000/open?file=${id}`, {
  //   signal: controller.signal,
  // })
  //   .then(async (res) => new Uint8Array(await res.arrayBuffer()))
  //   .then((img: Uint8Array) => {
  //     const photo = DynamicImage.from(img, 5472, 3648, meta);
  //     drawToCanvas(photo.canvas());
  //   });
}
