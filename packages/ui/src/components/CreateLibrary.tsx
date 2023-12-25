import { setSettingOpen } from '../App.tsx';
import Button from './Button.tsx';
import Icon from './Icon.tsx';
import { t } from 'tokyo-locales';

export default function () {
  return (
    <div class="w-full h-full backdrop-blur-xl bg-[#18191BEE] p-8 flex justify-center items-center flex-col">
      <h1 class="text-4xl font-thin mb-10">{t('create_library_headline')}</h1>

      <div class="flex justify-between items-center pb-8 col-span-2">
        <input type="text" />

        <Button variant="ghost" onClick={() => setSettingOpen(false)}>
          <Icon name="unknown" />
        </Button>
      </div>
    </div>
  );
}
