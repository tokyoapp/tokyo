import { createSignal, onCleanup, onMount } from 'solid-js';
import storage from './ClientStorage.worker';
import { DynamicImage } from './DynamicImage.ts';
import { location } from './Location.ts';
import Rating from './Rating.tsx';
import Action from './actions/Action.ts';

export default function Library() {
  const items = () =>
    [...location.entries].sort((a, b) => {
      const dateASlice = a.meta.create_date.split(' ');
      dateASlice[0] = dateASlice[0].replaceAll(':', '-');
      const dateA = new Date(dateASlice.join(' '));

      const dateBSlice = b.meta.create_date.split(' ');
      dateBSlice[0] = dateBSlice[0].replaceAll(':', '-');
      const dateB = new Date(dateBSlice.join(' '));

      return dateA.valueOf() - dateB.valueOf();
    });

  return (
    <div class="overflow-auto w-full grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 break-all gap-2 overscroll-none h-full">
      {items().map(({ path, meta }) => {
        return (
          <Thumb
            onClick={() => {
              Action.run('open', [path, meta]);
            }}
            src={path}
            meta={meta}
          />
        );
      })}
    </div>
  );
}

function Thumb({ src, meta, onClick }: { src: string; meta: any; onClick: () => void }) {
  const [img, setImg] = createSignal<HTMLCanvasElement>();

  let ele: HTMLDivElement;

  let controller: AbortController;

  const useThumb = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const dynimg = new DynamicImage(image, meta);
      const canvas = dynimg.canvas();
      canvas.style.width = '100%';
      canvas.style.maxHeight = '100%';
      canvas.style.objectFit = 'contain';
      setImg(canvas);
    };
    image.src = url;
  };

  const onView = async () => {
    controller = new AbortController();

    const id = encodeURIComponent(src);
    const tmp = await storage.readTemp(id);

    if (tmp && tmp.size > 0) {
      useThumb(tmp);
    } else {
      fetch(`http://localhost:8000/thumbnail?file=${id}`, {
        signal: controller.signal,
      }).then(async (res) => {
        const buffer = await res.arrayBuffer();
        const blob = new Blob([buffer]);
        storage.writeTemp(id, await blob.arrayBuffer());
        useThumb(blob);
      });
    }
  };

  onMount(() => {
    const observer = new IntersectionObserver(
      (entires) => {
        if (!img()) {
          entires.forEach((entry) => {
            if (entry.isIntersecting) {
              onView();
            } else {
              if (controller) {
                controller.abort();
              }
            }
          });
        }
      },
      {
        rootMargin: '0px 400px',
      }
    );

    observer.observe(ele);

    onCleanup(() => {
      observer.disconnect();
    });
  });

  return (
    <div
      tabIndex={0}
      class="h-52 p-3 relative overflow-hidden flex items-center justify-center bg-transparent bg-zinc-900 focus:bg-zinc-800 shadow-none"
      onClick={() => onClick()}
      ref={ele}
    >
      {img()}

      <div class="absolute bottom-2 left-2">
        <Rating rating={meta.rating} />
      </div>
    </div>
  );
}
