import { createSignal } from 'solid-js';
import { location } from '../Location.ts';
import Action from '../actions/Action';
import { file } from '../actions/open.ts';
import Icon from './Icon.tsx';
import Library from './Library';
import LocationSettings from './LocationSettings.tsx';
import Titlebar from './Titlebar.tsx';
import Preview from './Viewer';
import Info from './Info';
import CreateLibrary from './CreateLibrary.tsx';

const shortcuts: Record<string, () => void> = {
  r: Action.map('reload'),
};

window.addEventListener('keyup', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key in shortcuts) shortcuts[e.key]();
  }
});

export const [settingsOpen, setSettingOpen] = createSignal(false);

function App() {
  const itemCount = () => location.index.length;

  return (
    <>
      <Titlebar />

      <div class="app">
        <div class="library relative">
          {!location.path ? (
            <div class="absolute top-0 left-0 w-full h-full z-[999]">
              <CreateLibrary />
            </div>
          ) : null}

          {settingsOpen() ? (
            <div class="absolute top-0 left-0 w-full h-full z-[999]">
              <LocationSettings />
            </div>
          ) : null}

          <Library location={location} />
        </div>
        <div class="relative flex flex-col justify-center items-center">
          <Preview />
        </div>
        <div class="relative">
          <Info />
        </div>
      </div>

      <div class="statusbar text-slate-500 grid-cols-[1fr_1fr_auto] grid-flow-col items-center grid gap-3 px-2 text-sm">
        <div>
          <span>{itemCount()} items </span>
        </div>

        <div>
          <span class="mt-1 text-xs">{file.name} </span>
        </div>

        <div class="w-7">{Action.runningJobCount() > 0 ? <Icon name="loader" /> : null}</div>
      </div>
    </>
  );
}

export default App;
