import { createSignal, onCleanup, onMount } from 'solid-js';
import { location } from './Location.ts';
import Action from './actions/Action.ts';

export default function Library({}) {
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
  const [url, setUrl] = createSignal<string>();

  let ele: HTMLDivElement;

  const onView = () => {
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
      <img alt={url()} data-orientation={meta.orientation} decoding="async" src={url()} />
    </div>
  );
}
