import { createSignal } from 'solid-js';

type Meta = {
  width: number;
  height: number;
  orientation: number;
};

function Thumb({ src, onClick }: { src: string; onClick: () => void }) {
  const [meta, setMeta] = createSignal<Meta | undefined>();

  fetch(`http://localhost:8000/metadata?file=${encodeURIComponent(src)}`).then(async (res) => {
    const m = (await res.json()) as Meta;
    setMeta(m);
  });

  return (
    <>
      <div
        tabIndex={0}
        class="h-52 overflow-hidden flex items-center justify-center bg-transparent bg-zinc-900 focus:bg-zinc-800 shadow-none"
        onClick={() => onClick()}
      >
        <img
          data-orientation={meta()?.orientation}
          decoding="async"
          loading="lazy"
          src={`http://localhost:8000/thumbnail?file=${encodeURIComponent(src)}`}
        />
      </div>
    </>
  );
}

export default function Library({
  items,
  onOpen,
}: {
  items: Array<any>;
  onOpen: (item: string) => void;
}) {
  return (
    <div class="overflow-auto grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 break-all gap-2 overscroll-none h-full">
      {items.map((item) => {
        return <Thumb onClick={() => onOpen(item)} src={item} />;
      })}
    </div>
  );
}
