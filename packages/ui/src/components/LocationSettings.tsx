import { setSettingOpen } from './App.tsx';
import Button from './Button.tsx';
import Icon from './Icon.tsx';

export default function () {
  return (
    <div class="w-full h-full backdrop-blur-xl bg-[#18191BEE] p-8">
      <div class="flex justify-between items-center pb-8">
        <h1 class="text-4xl font-thin">Locations</h1>

        <Button variant="ghost" onClick={() => setSettingOpen(false)}>
          <Icon name="close" />
        </Button>
      </div>

      <div>
        <span>Libraries</span>
      </div>
      <div>
        <span>Ingest</span>
      </div>
      <div>
        <span>Export</span>
      </div>
    </div>
  );
}
