import storage from '../services/ClientStorage.worker';
import { Library, Entry, setFile } from '../Library.ts';
import { DynamicImage } from '../DynamicImage.ts';
import { loadImage, setLoading } from '../components/Viewer';

let controller: AbortController;

let timeout: number;

export default async function open(item: Entry) {
  clearTimeout(timeout);

  if (controller) controller.abort();

  controller = new AbortController();

  setFile(item);

  // loadImage(`http://127.0.0.1:8000/api/local/thumbnail?file=${id}`, metadata);

  const meta = await Library.metadata(item.path);

  setLoading(true);

  const tmp = await storage.readTemp(item.hash);

  const prevImg = new Image();
  prevImg.onload = () => {
    const img = new DynamicImage(prevImg, meta.metadata);

    img
      .resizeContain(1024)
      .canvas()
      .toBlob((blob) => {
        if (blob) loadImage(URL.createObjectURL(blob), item);
      });
  };

  if (tmp && tmp.size > 0) {
    prevImg.src = URL.createObjectURL(tmp);
  } else {
    const thumb = new Blob([meta.metadata?.thumbnail]);
    prevImg.src = URL.createObjectURL(thumb);
  }

  // timeout = setTimeout(() => {
  //   const img = new Image();
  //   img.onload = () => {
  //     new DynamicImage(img, meta).canvas().toBlob((blob) => {
  //       if (blob) loadImage(URL.createObjectURL(blob), metadata);
  //     });
  //   };
  //   img.src = `http://127.0.0.1:8000/api/local/thumbnail?file=${id}`;
  // }, 2000);

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
