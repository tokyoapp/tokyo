import 'components/components/layout/Group';
import 'components/components/tree-explorer';
import 'components/components/view-canvas';

import { createEffect } from 'solid-js';
import Library from './Library';
import { Loader } from './Loader';
import { location } from './Location.ts';
import Preview from './Viewer';
import Action from './actions/Action';
import { file } from './actions/open.ts';
import { listToTree } from './utils.ts';

const shortcuts: Record<string, () => void> = {
  r: Action.map('reload'),
};

window.addEventListener('keyup', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key in shortcuts) shortcuts[e.key]();
  }
});

const explorer = document.createElement('gyro-explorer');
explorer.className = 'w-52 flex-none';

function App() {
  createEffect(() => {
    explorer.setRoot({
      name: 'Explorer',
      children: listToTree(location.index),
    });
  });

  const itemCount = () => location.index.length;

  return (
    <>
      <div data-tauri-drag-region class="titlebar" />

      <gyro-layout class="app">
        <gyro-layout-column>
          <gyro-group show-tabs>
            <div tab="Explorer" class="p-1 flex">
              {explorer}
              <Library />
            </div>
          </gyro-group>
        </gyro-layout-column>

        <gyro-layout-column>
          <gyro-group show-tabs>
            <div tab="Viewer" class="flex flex-col justify-center items-center">
              <Preview />
            </div>
          </gyro-group>
        </gyro-layout-column>
      </gyro-layout>

      <div class="statusbar text-slate-500 grid-cols-[1fr_1fr_auto] grid-flow-col items-center grid gap-3 px-2 text-sm">
        <div>
          <span>{itemCount()} items </span>
        </div>

        <div>
          <span class="mt-1 text-xs">{file.name} </span>
        </div>

        <div class="w-7">{Action.runningJobCount() > 0 ? <Loader /> : null}</div>
        {/* <div>Jobs: {Action.runningJobCount()}</div> */}
      </div>
    </>
  );
}

export default App;
