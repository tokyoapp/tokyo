export default function Library({ items }: { items: Array<any> }) {
  console.log(items);

  return (
    <div class="overflow-auto grid grid-cols-6 break-all gap-2 overscroll-none">
      {items.map((item) => {
        return <div>{item}</div>;
      })}
    </div>
  );
}
