import Button from './Button';

export function ActivityBar() {
  return (
    <div class="activity-bar py-3 px-3 border-r border-zinc-800 flex flex-col gap-3">
      <Button variant="square">X</Button>
      <Button variant="square">Y</Button>
      <Button variant="square">Z</Button>
    </div>
  );
}
