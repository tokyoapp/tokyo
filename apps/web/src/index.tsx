import { render } from "solid-js/web";

import "../assets/styles/main.scss";

import Evolution from "ui/components/Evolution";

import fs from "filestorage";
import { default as compositor, test } from "compositor";

await compositor();
test("argument here");

render(() => <Evolution />, document.getElementById("root") as HTMLElement);

async function main() {
  const items = (await fs.list()).map((item) => item[1].name);

  const media = { items: JSON.stringify(items, null, "\t") };

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
}

window.addEventListener("DOMContentLoaded", main);
