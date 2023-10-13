import { createSignal, onMount } from 'solid-js';
import { Library, file, locations, index } from './Library';
import CreateLibrary from './components/CreateLibrary.tsx';
import Edit from './components/Edit';
import Explorer from './components/Explorer';
import Info from './components/Info';
import LocationSettings from './components/LocationSettings.tsx';
import { Tabs } from './components/Tabs.tsx';
import Preview from './components/Viewer';
import './components/notifications/index.ts';

export const [settingsOpen, setSettingOpen] = createSignal(false);

function App() {
  onMount(async () => {
    const locs = await Library.locations();

    const stream = locs.stream();

    stream.pipeTo(new WritableStream({
      async write(cnk) {
        console.log(cnk)
        const index = await Library.index([cnk.id]);
        const strm = index.stream();
        strm.pipeTo(new WritableStream({
          write(entry) {
            // console.log(entry)
          }
        }))
      }
    }))
  });

  return (
    <div
      class={`relative w-full h-full grid ${file() ? 'grid-cols-[250px_1.25fr_300px]' : 'grid-cols-1'
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

          <Explorer index={index()} />
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
  );
}

export default App;
