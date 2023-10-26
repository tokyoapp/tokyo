import { platform } from '@tauri-apps/plugin-os';
import { IndexEntryMessage } from 'proto';
import { ErrorBoundary, createEffect, createSignal } from 'solid-js';
import { locationsAccessor } from './accessors/locations.ts';
import Action from './actions/Action.ts';
import Combobox from './components/Combobox.tsx';
import CreateLibrary from './components/CreateLibrary.tsx';
import Edit from './components/Edit';
import Explorer from './components/Explorer';
import Icon from './components/Icon.tsx';
import Info from './components/Info';
import LocationSettings from './components/LocationSettings.tsx';
import { Tabs } from './components/Tabs.tsx';
import Titlebar from './components/Titlebar.tsx';
import Preview from './components/Viewer';
import './components/notifications/index.ts';
import { ErrorNotification, Notifications } from './components/notifications/index.ts';

export const [settingsOpen, setSettingOpen] = createSignal(false);

// selected locations

export const [file, setFile] = createSignal<IndexEntryMessage>();

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

  const [os, setOS] = createSignal('browser');

  if ('__TAURI_INVOKE__' in window) {
    platform()
      .then((os) => {
        setOS(os);
      })
      .catch((err) => {
        console.error('Platform Error', err);
        return undefined;
      });
  }

  const locations = locationsAccessor();
  const [selectedLocations, setSelectedLocations] = createSignal<string[]>([]);

  createEffect(() => {
    const locs = locations.store;
    if (selectedLocations().length === 0) {
      setSelectedLocations([locs[0].id]);
    }
  });

  return (
    <ErrorBoundary
      fallback={(err) => {
        console.error(err);
        return err;
      }}
    >
      <Titlebar style={os()}>
        <Combobox
          class="px-1 pointer-events-auto"
          items={locations.store.map((lib) => {
            return {
              id: lib.id,
              value: `${lib.name}`,
              get checked() {
                return selectedLocations().includes(lib.id);
              },
            };
          })}
          title={'Library'}
          onInput={(values) => {
            setSelectedLocations(values);
          }}
          content={
            <div>
              <hr class="my-2" />
              <button
                type="button"
                onMouseUp={(e) => {
                  e.stopImmediatePropagation();
                  e.stopPropagation();
                  e.preventDefault();
                  Action.run('create', [locations]);
                }}
                class="px-2 py-1 w-full text-left shadow-none opacity-50 hover:opacity-100"
              >
                <Icon name="plus" class="mr-2" />
                <span>Create new</span>
              </button>
            </div>
          }
        >
          {selectedLocations().map((loc) => {
            return <span>{locations.store.find((l) => l.id === loc)?.name}</span>;
          })}
          <Icon class="pl-2" name="expand-down" />
        </Combobox>
      </Titlebar>

      <notification-feed class="fixed z-10 left-1/2 top-20 -translate-x-1/2 w-80" />

      <div
        class={`relative w-full h-full grid ${
          file() ? 'grid-cols-[250px_1.25fr_300px]' : 'grid-cols-1'
        }`}
      >
        <div class="relative">
          <div class="absolute top-0 left-0 w-full h-full">
            {!locations.store.length ? (
              <div class="absolute top-0 left-0 w-full h-full z-40">
                <CreateLibrary />
              </div>
            ) : null}

            {settingsOpen() ? (
              <div class="absolute top-0 left-0 w-full h-full z-40">
                <LocationSettings />
              </div>
            ) : null}

            <Explorer locations={selectedLocations} small={!!file()} />
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
