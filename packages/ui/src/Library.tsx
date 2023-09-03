import { createSignal, onCleanup, onMount } from 'solid-js';
import { location } from './Location.ts';

type Meta = {
  hash: string;
  width: number;
  height: number;
  orientation: number;
};

function Thumb({ src, onClick }: { src: string; onClick: () => void }) {
  const [url, setUrl] = createSignal<string>();
  const [meta, setMeta] = createSignal<Meta>();

  let ele: HTMLDivElement;

  const onView = () => {
    fetch(`http://localhost:8000/metadata?file=${encodeURIComponent(src)}`).then(async (res) => {
      const m = (await res.json()) as Meta;
      setMeta(m);
    });
    fetch(`http://localhost:8000/thumbnail?file=${encodeURIComponent(src)}`).then(async (res) => {
      const buffer = await res.arrayBuffer();
      const url = URL.createObjectURL(new Blob([buffer]));
      setUrl(url);
    });
  };

  onMount(() => {
    const observer = new IntersectionObserver(
      (entires) => {
        if (!url()) {
          entires.forEach((entry) => {
            if (entry.isIntersecting) {
              onView();
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
      class="h-52 overflow-hidden flex items-center justify-center bg-transparent bg-zinc-900 focus:bg-zinc-800 shadow-none"
      onClick={() => onClick()}
      ref={ele}
    >
      <img alt={url()} data-orientation={meta()?.orientation} decoding="async" src={url()} />
    </div>
  );
}

export default function Library({
  onOpen,
}: {
  onOpen: (item: string) => void;
}) {
  const items = () => location.index;

  return (
    <div class="overflow-auto w-full grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 break-all gap-2 overscroll-none h-full">
      {items().map((item) => {
        return <Thumb onClick={() => onOpen(item)} src={item} />;
      })}
    </div>
  );
}
