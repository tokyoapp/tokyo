import Greet from "./modules/greet";
import "./modules/ffmpeg/ffmpeg";
import { log } from "./log";

import "./components/FileDropzone";
import "./components/ActionButton";

declare global {
  const __APP_VERSION__: string;
  const __IS_DEBUG__: boolean;
}

async function main() {
  console.log(
    "%cWeb Image Creator - Version: " + __APP_VERSION__,
    "color:red;font-weight:bold;"
  );

  log("Web Image Creator");
  log(`Version ${__APP_VERSION__}`);

  log("Test greet module");
  Greet.greet("js");

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
