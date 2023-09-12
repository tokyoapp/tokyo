import { appWindow } from '@tauri-apps/api/window';
import { location } from '../Library.ts';
import { setSettingOpen, settingsOpen } from './App.tsx';
import Button from './Button.tsx';
import Icon from './Icon.tsx';

export default function Titlebar() {
  document
    .getElementById('titlebar-minimize')
    ?.addEventListener('click', () => appWindow.minimize());
  document
    .getElementById('titlebar-maximize')
    ?.addEventListener('click', () => appWindow.toggleMaximize());
  document.getElementById('titlebar-close')?.addEventListener('click', () => appWindow.close());

  return (
    <div data-tauri-drag-region class="bg-[#18191B] border-b border-[#2A2A2A]">
      <div class="w-full h-11 py-2 px-2 pointer-events-none flex items-center text-xs">
        <div class="w-20" />
        <div class="flex gap-4 text-zinc-300 items-center">
          <Button
            onClick={() => {
              setSettingOpen(!settingsOpen());
            }}
          >
            <div
              class={`flex items-center justify-center duration-100 transition-transform ${
                settingsOpen() ? 'rotate-90' : 'rotate-0'
              }`}
            >
              <Icon name="chevron-right" />
            </div>
          </Button>
          <div>{location.host ? new URL(location.host).host : null}</div>
          <span>{location.path}</span>
        </div>
      </div>
    </div>
  );
}
