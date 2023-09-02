import 'components/components/layout/Group';
import 'components/components/tree-explorer';
import 'components/components/view-canvas';

import { createStore } from 'solid-js/store';

import Library from './Library';
import { Loader } from './Loader';
import Action from './actions/Action';
import { file } from './actions/open.ts';
import { canvas } from './viewer.ts';

const shortcuts: Record<string, () => void> = {
  r: Action.map('reload'),
};

window.addEventListener('keyup', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key in shortcuts) shortcuts[e.key]();
  }
});

const explorer = document.createElement('gyro-explorer');
explorer.className = 'w-64 flex-none';

const [items, setItems] = createStore<string[]>([]);

type Child = {
  name: string;
  path: string;
  children: Child[];
};

function listToTree(list: Array<string>) {
  const children: Array<Child> = [];
  for (const item of list) {
    let cwd = children;

    const path = item.split('/').slice(1);

    for (const slice of path) {
      const dir = cwd.find((item) => item.name === slice);
      if (dir) {
        cwd = dir.children;
      } else {
        cwd.push({
          path: `/${path.join('/')}`,
          name: slice,
          uncollapsed: true,
          children: [],
        });
        break;
      }
    }
  }
  return children;
}

fetch('http://localhost:8000/').then(async (res) => {
  const list = await res.json();

  explorer.setRoot({
    name: 'Explorer',
    children: listToTree(list),
  });

  setItems(list);
});

function App() {
  return (
    <>
      <div data-tauri-drag-region class="titlebar" />

      <gyro-layout class="app">
        <gyro-layout-column>
          <gyro-group show-tabs>
            <div tab="Explorer" class="p-1 flex">
              {explorer}
              <Library
                items={items}
                onOpen={(item) => {
                  Action.run('open', [item]);
                }}
              />
            </div>
          </gyro-group>
        </gyro-layout-column>

        <gyro-layout-column>
          <gyro-group show-tabs>
            <div tab="Viewer" class="flex flex-col justify-center items-center">
              {/* <ImageEditor onOpen={() => open()} /> */}
              {canvas}
            </div>
          </gyro-group>
        </gyro-layout-column>
      </gyro-layout>

      <div class="statusbar grid-cols-[1fr_1fr_auto] grid-flow-col items-center grid gap-3 px-2 text-sm">
        <div></div>
        <span class="mt-1 text-xs">{file.name}</span>
        <div class="w-7">{Action.runningJobCount() > 0 ? <Loader /> : null}</div>
        {/* <div>Jobs: {Action.runningJobCount()}</div> */}
      </div>
    </>
  );
}

export default App;
