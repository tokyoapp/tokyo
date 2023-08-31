import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { ImageEditor } from "image-editor";
import Library from "./Library.tsx";
import { createStore } from "solid-js/store";
import Action from "./actions";

const [items, setItems] = createStore<any[]>([]);

const [name, setName] = createSignal("");

function photoToCanvas(img: Uint8Array) {
  const canvas = document.createElement("canvas");
  const ctxt = canvas.getContext("2d");

  const data = new ImageData(5472, 3648, { colorSpace: "srgb" });

  for (let i = 0; i < data.data.length / 4; i++) {
    data.data[i * 4 + 0] = img[i * 3 + 0];
    data.data[i * 4 + 1] = img[i * 3 + 1];
    data.data[i * 4 + 2] = img[i * 3 + 2];
    data.data[i * 4 + 3] = 256;
  }

  canvas.width = data.width;
  canvas.height = data.height;
  ctxt?.putImageData(data, 0, 0);

  return canvas;
}

const canvas = document.createElement("canvas");
canvas.style.width = "500px";

function drawToCanvas(photo: HTMLImageElement | HTMLCanvasElement, meta: any) {
  const ctxt = canvas.getContext("2d");

  switch (meta.orientation) {
    case 8:
      canvas.height = photo.width;
      canvas.width = photo.height;
      ctxt?.translate(canvas.width / 2, canvas.height / 2);
      ctxt?.rotate((Math.PI / 180) * 270);
      ctxt?.drawImage(photo, -canvas.width / 2, -canvas.height / 2);
      break;
    default:
      canvas.width = photo.width;
      canvas.height = photo.height;
      ctxt?.drawImage(photo, 0, 0);
  }
}

async function open(p: string) {
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
    drawToCanvas(prevImg, meta);
  };
  prevImg.src = `http://localhost:8000/thumbnail?file=${encodeURIComponent(p)}`;

  const img: Uint8Array = await fetch(
    `http://localhost:8000/open?file=${encodeURIComponent(p)}`
  ).then(async (res) => new Uint8Array(await res.arrayBuffer()));
  const photo = photoToCanvas(img);
  drawToCanvas(photo, meta);
}

fetch("http://localhost:8000/").then(async (res) => {
  const list = await res.json();
  setItems(list);
});

function App() {
  return (
    <div class="app">
      <Library
        items={items}
        onOpen={(item) => {
          open(item);
        }}
      />
      <div class="flex justify-center items-center">
        {/* <ImageEditor onOpen={() => open()} /> */}
        {canvas}
      </div>
    </div>
  );
}

export default App;

const shortcuts: Record<string, () => void> = {
  r: Action.map("reload"),
};

window.addEventListener("keyup", (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key in shortcuts) shortcuts[e.key]();
  }
});
