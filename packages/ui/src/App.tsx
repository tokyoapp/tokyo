import { createSignal } from 'solid-js';
import Titlebar from './components/Titlebar.tsx';
import Action from './actions/Action';
import Explorer from './components/Explorer';
import { Library, file, locations } from './Library';
import LocationSettings from './components/LocationSettings.tsx';
import Preview from './components/Viewer';
import Info from './components/Info';
import Edit from './components/Edit';
import CreateLibrary from './components/CreateLibrary.tsx';
import { Tabs } from './components/Tabs.tsx';
import './components/notifications/index.ts';
import { ErrorNotification, Notifications } from './components/notifications/index.ts';

const shortcuts: Record<string, () => void> = {
  r: Action.map('reload'),
  p: Action.map('search'),
};

window.addEventListener('keyup', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key in shortcuts) shortcuts[e.key]();
  }
});

export const [settingsOpen, setSettingOpen] = createSignal(false);


function App() {
  window.addEventListener('error', (e) => {
    Notifications.push(
      new ErrorNotification({
        message: `Error: ${e.message}`,
        time: 3000,
      })
    );
  });

  return (
    <>
      <Titlebar />

      <notification-feed class="fixed z-10 left-1/2 top-20 -translate-x-1/2 w-80" />

      <div
        class={`relative w-full h-full grid ${file() ? 'grid-cols-[250px_1.25fr_300px]' : 'grid-cols-1'
          }`}
      >
        <div class="relative">
          <div class="absolute top-0 left-0 w-full h-full">
            {!locations.length ? (
              <div class="absolute top-0 left-0 w-full h-full z-40">
                <CreateLibrary />
              </div>
            ) : null}

            {settingsOpen() ? (
              <div class="absolute top-0 left-0 w-full h-full z-40">
                <LocationSettings />
              </div>
            ) : null}

            <Explorer />
          </div>
        </div>

        {file() ? (
          <>
            <div class="relative flex flex-col justify-center items-center">
              <Preview />
            </div>

            <div class="relative mt-2 mr-2 rounded-t-md overflow-hidden">
              <Tabs>
                <Tabs.Tab tab="Info" icon="ph-info">
                  <Info file={file()} />
                </Tabs.Tab>
                <Tabs.Tab tab="Exposure" icon="ph-pencil">
                  <Edit file={file()} />
                </Tabs.Tab>
                <Tabs.Tab tab="Color" icon="ph-pencil">
                  <Edit file={file()} />
                </Tabs.Tab>
                <Tabs.Tab tab="Effects" icon="ph-pencil">
                  <Edit file={file()} />
                </Tabs.Tab>
              </Tabs>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

export default App;
