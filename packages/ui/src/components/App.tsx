import 'components/components/layout/Group';
import 'components/components/tree-explorer';
import 'components/components/view-canvas';

import { location } from '../Location.ts';
import Action from '../actions/Action';
import { file } from '../actions/open.ts';
import Library from './Library';
import { Loader } from './Loader';
import Titlebar from './Titlebar.tsx';
import Preview from './Viewer';

const shortcuts: Record<string, () => void> = {
  r: Action.map('reload'),
};

window.addEventListener('keyup', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key in shortcuts) shortcuts[e.key]();
  }
});

// const explorer = document.createElement('gyro-explorer');
// explorer.className = 'w-52 flex-none';

function App() {
  // createEffect(() => {
  //   explorer.setRoot({
  //     name: 'Explorer',
  //     children: listToTree(location.index),
  //   });
  // });

  const itemCount = () => location.index.length;

  return (
    <>
      <Titlebar />

      <div class="app">
        <div class="library">
          <Library location={location} />
        </div>
        <div class="flex flex-col justify-center items-center">
          <Preview />
        </div>
      </div>

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
