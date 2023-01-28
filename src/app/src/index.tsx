/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";

import { State } from "@luckydye/app-state";
import { log } from "../../app/src/log";
import fs from "./modules/filesystem";

const modules = import.meta.glob("./components/*");

render(() => <App />, document.getElementById("root") as HTMLElement);

for (const path in modules) {
  // load all components async
  modules[path]();
}

async function main() {
  log("Web Image Creator");

  const items = (await fs.list()).map((item) => item[1].name);
  State.scope("media", { items: JSON.stringify(items, null, "\t") });

  fs.get("cap.mp%01d").then(async (file) => {
    const f = await file?.getFile();
    if (f) {
      const uri = URL.createObjectURL(f);

      const video = document.createElement("video");
      video.src = uri;
      video.controls = true;
      video.loop = true;

      document.body.append(video);
    }
  });

  // fs.get("output.webp").then(async (file) => {
  //   const f = await file?.getFile();
  //   const uri = URL.createObjectURL(f);

  //   const img = new Image();
  //   img.src = uri;

  //   document.body.append(img);
  // });

  // log("Load example EXR file");
  // const exrFile = await (await fetch("./powder.exr")).arrayBuffer();

  // log("decode exr file");
  // await EXR.load(new Uint8Array(exrFile))
  //   .then(() => {
  //     log("done");
  //   })
  //   .catch((err) => {
  //     console.error(err);
  //     log("decode failed");
  // });
}

window.addEventListener("DOMContentLoaded", main);
