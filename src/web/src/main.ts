import Greet from "./modules/greet";
import EXR from "./modules/exr";
import { exec } from "./nodes/vidToWebp";

declare global {
  const __APP_VERSION__: string;
}

function log(string: string) {
  const pre = document.querySelector("pre");
  if (pre) {
    const lines = pre.innerHTML.split("\n");
    lines.push(string);
    if (lines.length > 6) {
      lines.shift();
    }
    pre.innerHTML = lines.join("\n");
  }
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

  log("Load example EXR file");
  const exrFile = await (await fetch("./powder.exr")).arrayBuffer();

  log("decode exr file");
  await EXR.load(new Uint8Array(exrFile))
    .then(() => {
      log("done");
    })
    .catch((err) => {
      console.error(err);
      log("decode failed");
    });

  exec();
}

window.addEventListener("DOMContentLoaded", main);
