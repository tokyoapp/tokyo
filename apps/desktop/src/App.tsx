import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { ImageEditor } from "image-editor";

const [name, setName] = createSignal("");

function photoToCanvas(img: Array<number>) {
  const canvas = document.createElement("canvas");
  const ctxt = canvas.getContext("2d");

  const data = new ImageData(5472, 3648, { colorSpace: "srgb" });
  for (let i = 0; i < data.data.length / 4; i++) {
    data.data[i * 4 + 0] = img[i * 3 + 0] / 256;
    data.data[i * 4 + 1] = img[i * 3 + 1] / 256;
    data.data[i * 4 + 2] = img[i * 3 + 2] / 256;
    data.data[i * 4 + 3] = 256;
  }

  canvas.width = data.width;
  canvas.height = data.height;
  ctxt?.putImageData(data, 0, 0);

  return canvas;
}

async function open() {
  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  const meta: {
    width: number;
    height: number;
    orientation: number;
  } = await invoke("metadata", { path: name() });
  console.log(meta);

  const img: Array<number> = await invoke("open", { path: name() });
  const photo = photoToCanvas(img);

  const canvas = document.createElement("canvas");
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

  canvas.style.width = "100%";
  document.body.append(canvas);
}

function App() {
  return <ImageEditor onOpen={open} />;
}

export default App;
