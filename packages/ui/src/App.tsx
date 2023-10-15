import { ErrorBoundary, createEffect, createSignal } from 'solid-js';
import CreateLibrary from './components/CreateLibrary.tsx';
import Edit from './components/Edit';
import Explorer from './components/Explorer';
import Info from './components/Info';
import LocationSettings from './components/LocationSettings.tsx';
import { Tabs } from './components/Tabs.tsx';
import Preview from './components/Viewer';
import './components/notifications/index.ts';
import { createStore } from 'solid-js/store';
import { locationsAccessor } from './accessors/locations.ts';
import Titlebar from './components/Titlebar.tsx';
import { IndexEntryMessage, LibraryMessage } from 'proto';
import { platform } from '@tauri-apps/plugin-os';
import { ErrorNotification, Notifications } from './components/notifications/index.ts';
import Action from './actions/Action.ts';

export const [settingsOpen, setSettingOpen] = createSignal(false);

// selected locations

const [file, setFile] = createSignal<IndexEntryMessage>();
const [locations, setLocations] = createSignal<LibraryMessage[]>([]);

const shortcuts: Record<string, () => void> = {
  r: Action.map('reload'),
  p: Action.map('search'),
};

window.addEventListener('keyup', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key in shortcuts) shortcuts[e.key]();
  }
});

function App() {
  window.addEventListener('error', (e) => {
    Notifications.push(
      new ErrorNotification({
        message: `Error: ${e.message}`,
        time: 3000,
      })
    );
  });

  const [params, setParams] = createStore({
    id: '1',
  });

  const [os, setOS] = createSignal('');

  if (window.__TAURI_INVOKE__) {
    platform()
      .then((os) => {
        setOS(os);
      })
      .catch((err) => {
        console.error(err);
        return undefined;
      });
  } else {
    setOS('browser');
  }

  setParams({
    id: Math.floor(Math.random() * 10000).toString(),
  });

  const d = locationsAccessor(params);

  const index = createStore<IndexEntryMessage[]>([]);

  createEffect(() => {
    console.log(d.data);
  });

  return (
    <ErrorBoundary
      fallback={(err) => {
        console.error(err);
        return err;
      }}
    >
      <Titlebar locations={d.data} os={os()} />

      <notification-feed class="fixed z-10 left-1/2 top-20 -translate-x-1/2 w-80" />

      <div
        class={`relative w-full h-full grid ${
          file() ? 'grid-cols-[250px_1.25fr_300px]' : 'grid-cols-1'
        }`}
      >
        <div class="relative">
          <div class="absolute top-0 left-0 w-full h-full">
            {!locations().length ? (
              <div class="absolute top-0 left-0 w-full h-full z-40">
                <CreateLibrary />
              </div>
            ) : null}

            {settingsOpen() ? (
              <div class="absolute top-0 left-0 w-full h-full z-40">
                <LocationSettings />
              </div>
            ) : null}

            <Explorer index={index[0]} small={!!file()} />
          </div>
        </div>

        {file() ? (
          <>
            <div class="relative flex flex-col justify-center items-center">
              <Preview file={file()} onClose={() => setFile(undefined)} />
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
    </ErrorBoundary>
  );
}

export default App;
