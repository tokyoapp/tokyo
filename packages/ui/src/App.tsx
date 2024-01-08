import { platform } from '@tauri-apps/plugin-os';
import { IndexEntryMessage } from 'tokyo-proto';
import { ErrorBoundary, createSignal } from 'solid-js';
import Jobs from './actions/Action.ts';
import Explorer from './components/Explorer';
import LocationSettings from './components/LocationSettings.jsx';
import Titlebar from './components/Titlebar.jsx';
import Preview from './components/Viewer';
import { Notifications } from './components/notifications/Notifications.ts';
import { ActivityBar } from './components/Activitybar.jsx';
import { Basic } from './properties/Basic.ts';
import { Properties } from './components/Properties.tsx';

export const [settingsOpen, setSettingOpen] = createSignal(false);

export const [file, setFile] = createSignal<IndexEntryMessage>();

const models = {
  basic: new Basic(),
};

const shortcuts: Record<string, () => void> = {
  r: Jobs.map('reload'),
  p: Jobs.map('search'),
};

window.addEventListener('keyup', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key in shortcuts) shortcuts[e.key]();
  }
});

export default function App() {
  window.addEventListener('error', (e) => {
    Notifications.error(e.message);
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

      <notification-feed class="fixed z-50 left-1/2 top-20 -translate-x-1/2 w-80" />

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
                <Preview models={models} file={file()} onClose={() => setFile(undefined)} />
              </div>

              <Properties models={models} file={file()} />
            </>
          ) : null}
        </div>
      </div>
    </ErrorBoundary>
  );
}
