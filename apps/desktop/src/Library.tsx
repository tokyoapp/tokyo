export default function Library({
  items,
  onOpen,
}: {
  items: Array<any>;
  onOpen: (item: string) => void;
}) {
  return (
    <div class="overflow-auto grid grid-cols-4 break-all gap-2 overscroll-none">
      {items.map((item) => {
        return (
          <div
            tabIndex={0}
            class="h-52 overflow-hidden flex items-center justify-center bg-transparent bg-zinc-900 focus:bg-zinc-800 shadow-none"
            onClick={() => onOpen(item)}
          >
            <img decoding="async" loading="lazy" src={`http://localhost:8000/thumbnail?file=${encodeURIComponent(item)}`} />
          </div>
        );
      })}
    </div>
  );
}
