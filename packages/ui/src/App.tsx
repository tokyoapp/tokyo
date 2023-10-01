import { createSignal } from 'solid-js';
import Titlebar from './components/Titlebar.tsx';
import { location } from './Library.ts';
import Action from './actions/Action';
import Explorer from './components/Explorer';
import { Library, file } from './Library';
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
  // const itemCount = () => location.index.length;

  Library.list().then(([loc]) => {
    Library.index(loc.name).then(console.log);

    Library.system().then(console.log);

    // Library.open(loc.name).then(() => {
    //   Notifications.push(
    //     new Notification({
    //       message: t('notification_loaded', ['default']),
    //       time: 2000,
    //     })
    //   );
    // });
  });

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
        class={`relative w-full h-full grid ${
          file() ? 'grid-cols-[250px_1.25fr_300px]' : 'grid-cols-1'
        }`}
      >
        <div class="relative">
          <div class="absolute top-0 left-0 w-full h-full">
            {!location().path ? (
              <div class="absolute top-0 left-0 w-full h-full z-40">
                <CreateLibrary />
              </div>
            ) : null}

            {settingsOpen() ? (
              <div class="absolute top-0 left-0 w-full h-full z-40">
                <LocationSettings />
              </div>
            ) : null}

            <Explorer location={location()} />
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

      {/* <div class="statusbar text-slate-500 grid-cols-[1fr_1fr_auto] grid-flow-col items-center grid gap-3 px-2 text-sm">
        <div>
          <span>{itemCount()} items </span>
        </div>

        <div>
          <span class="mt-1 text-xs">{file.name} </span>
        </div>

        <div class="w-7">{Action.runningJobCount() > 0 ? <Icon name="loader" /> : null}</div>
      </div> */}
    </>
  );
}

export default App;
