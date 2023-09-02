import 'components/components/layout/Group';
import 'components/components/tree-explorer';
import 'components/components/view-canvas';

import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { DynamicImage } from './DynamicImage';

import Library from './Library';
import Action from './actions/Action';

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
const [name, setName] = createSignal('');

const canvas = document.createElement('canvas');
canvas.style.width = '100%';
canvas.style.maxHeight = '90vh';
canvas.style.objectFit = 'contain';

function drawToCanvas(photo: HTMLImageElement | HTMLCanvasElement) {
  const ctxt = canvas.getContext('2d');
  canvas.width = photo.width;
  canvas.height = photo.height;
  ctxt?.drawImage(photo, 0, 0);
}

async function open(p: string) {
  setName(p);

  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  const meta: {
    width: number;
    height: number;
    orientation: number;
  } = await fetch(`http://localhost:8000/metadata?file=${encodeURIComponent(p)}`).then((res) =>
    res.json()
  );

  const prevImg = new Image();
  prevImg.onload = () => {
    const img = new DynamicImage(prevImg, meta);
    drawToCanvas(img.toCanvas());
  };
  prevImg.src = `http://localhost:8000/thumbnail?file=${encodeURIComponent(p)}`;

  const img: Uint8Array = await fetch(
    `http://localhost:8000/open?file=${encodeURIComponent(p)}`
  ).then(async (res) => new Uint8Array(await res.arrayBuffer()));
  const photo = DynamicImage.from(img, 5472, 3648, meta);
  drawToCanvas(photo.toCanvas());
}

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
    <gyro-layout class="app">
      <gyro-layout-column>
        <gyro-group show-tabs>
          <div tab="Explorer" class="p-1 flex">
            {explorer}
            <Library
              items={items}
              onOpen={(item) => {
                open(item);
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
            <span class="mt-1 text-xs">{name()}</span>
          </div>
        </gyro-group>
      </gyro-layout-column>
    </gyro-layout>
  );
}

export default App;
