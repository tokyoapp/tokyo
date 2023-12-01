import { platform } from '@tauri-apps/plugin-os';
import { IndexEntryMessage } from 'proto';
import { ErrorBoundary, createSignal } from 'solid-js';
import Jobs from './actions/Action.ts';
import Edit from './components/Edit';
import Explorer from './components/Explorer';
import Info from './components/Info';
import LocationSettings from './components/LocationSettings.tsx';
import { Tabs } from './components/Tabs.tsx';
import Titlebar from './components/Titlebar.tsx';
import Preview from './components/Viewer';
import './components/notifications/index.ts';
import { ErrorNotification, Notifications } from './components/notifications/index.ts';
import Button from './components/Button.tsx';
import { ActivityBar } from './components/Activitybar.tsx';

export const [settingsOpen, setSettingOpen] = createSignal(false);

// selected locations

export const [file, setFile] = createSignal<IndexEntryMessage>();

const shortcuts: Record<string, () => void> = {
  r: Jobs.map('reload'),
  p: Jobs.map('search'),
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

  const [os, setOS] = createSignal('macos');

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

  return (
    <ErrorBoundary
      fallback={(err: Error) => {
        console.error(err);
        return (
          <>
            <Titlebar style={os()} />
            <notification-feed class="fixed z-10 left-1/2 top-20 -translate-x-1/2 w-80" />
            <div
              class={`p-10 relative w-full h-full grid ${
                file() ? 'grid-cols-[250px_1.25fr_300px]' : 'grid-cols-1'
              }`}
            >
              <div>
                <h1 class="text-2xl pb-4">Unknown Error</h1>
                <pre class="pb-2">{err.toString()}</pre>
                <pre class="text-xs">{err.stack}</pre>
              </div>
            </div>
          </>
        );
      }}
    >
      <Titlebar style={os()} />

      <notification-feed class="fixed z-10 left-1/2 top-20 -translate-x-1/2 w-80" />

      <div class="grid grid-cols-[auto_1fr]">
        <ActivityBar />

        <div
          class={`relative w-full h-full grid ${
            file() ? 'grid-cols-[250px_1.25fr_300px]' : 'grid-cols-1'
          }`}
        >
          <div class="relative">
            <div class="absolute top-0 left-0 w-full h-full">
              {settingsOpen() ? (
                <div class="absolute top-0 left-0 w-full h-full z-40">
                  <LocationSettings />
                </div>
              ) : null}

              <Explorer small={!!file()} />
            </div>
          </div>

          {file() ? (
            <>
              <div class="relative flex flex-col justify-center items-center">
                <Preview file={file()} onClose={() => setFile(undefined)} />
              </div>

              <div class="relative mt-2 mr-2 overflow-hidden">
                <div class="absolute top-0 bottom-0 right-0 h-auto overflow-auto">
                  <Tabs>
                    <Tabs.Tab title="Info" icon="ph-info" open>
                      <Info file={file()} />
                    </Tabs.Tab>
                    <Tabs.Tab title="Exposure" icon="ph-pencil" open>
                      <Edit file={file()} />
                    </Tabs.Tab>
                    <Tabs.Tab title="Color" icon="ph-pencil">
                      <Edit file={file()} />
                    </Tabs.Tab>
                    <Tabs.Tab title="Effects" icon="ph-pencil">
                      <Edit file={file()} />
                    </Tabs.Tab>
                  </Tabs>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
