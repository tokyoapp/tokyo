// import '@uncut/gyro/components/CookieDisclaimer';

import { VirtualFileSystem } from "filesystem";
import { ProgressBar } from "./components/Progressbar";

window.log = (...str) => {
  new Gyro.Notification({ text: str.join(" "), time: 2000 }).show();
  console.log(...str);
};

window.warn = window.log;
window.error = window.log;

const openFilesButton = document.createElement("input");
openFilesButton.type = "file";

const openButton = document.createElement("input");
openButton.type = "file";

export class Client {
  constructor() {
    this.actions = [
      {
        name: "file.open",
        description: "Import Archives",
        shortcut: "Ctrl+I",
        onAction() {
          openButton.click();
        },
      },
      {
        name: "files.open",
        description: "Import model files",
        shortcut: "Ctrl+Shift+I",
        onAction() {
          openFilesButton.click();
        },
      },
    ];
    window.addEventListener("DOMContentLoaded", (e) => init());
  }
}

let scene;
let progressbar;
const filesystem = new VirtualFileSystem();

function init() {
  showLoading();

  const explorer = document.querySelector("gyro-explorer");
  // explorer.setFilter("name", /\.mdl|\.bsp|\.gltf|\.wav/g);

  async function openFile(file) {
    if (progressbar) progressbar.remove();
    if (!file) return;

    if (file.type == "folder") {
      file.uncollapsed = !file.uncollapsed;
      explorer.render();
    } else {
      scene.clear();

      window.log = (...str) => {
        progressbar.log(str.join(" "));
      };

      importModelFile(file)
        .catch((err) => {
          console.error(err);
          progressbar.log(err.message);
          progressbar.log("Error loading file.");
          new Gyro.Notification({ text: "Error loading file.", time: 5000 }).show();
        })
        .finally(() => {
          setTimeout(() => progressbar.remove(), 1000);

          window.log = (...str) => {
            new Gyro.Notification({ text: str.join(" "), time: 2000 }).show();
            console.log(...str);
          };
        });
    }
  }

  explorer.addEventListener("addfile", (e) => importModelFile(e.file));
  explorer.addEventListener("openfile", (e) => openFile(e.file));

  openButton.addEventListener("change", async (e) => {
    const file = openButton.files[0];

    if (file && file.name.match(/\.bsp$/g)) {
      importBSPPakfile(file);
    }

    if (file && file.name.match(/\.vpk$/g)) {
      importVPKArchives(openButton.files);
    }
  });

  openFilesButton.addEventListener("change", async (e) => {
    console.log(e);

    importValidFiles(openFilesButton.files);
  });

  async function importValidFiles(filesArray) {
    for (let file of filesArray) {
      if (file.name.match(/[\.vvd$|\.mdl$|\.vtx$|\.vmt$|\.bsp$|\.gltf$]/g)) {
        const entry = file.webkitRelativePath || file.name;
        filesystem.fileRegistry[entry.toLocaleLowerCase()] = {
          file: entry,
          async arrayBuffer() {
            return file.arrayBuffer();
          },
        };

        console.log(filesystem);
      }
    }

    const tree = filesystem.getTree();
    tree.name = "Root";
    tree.uncollapsed = true;

    console.log(tree);

    explorer.setRoot(tree);
    explorer.render();
  }

  hideLoading();
}

function showLoading() {
  document.body.setAttribute("loading", "");
}

function hideLoading() {
  document.body.removeAttribute("loading");
}

function downloadBlob(blob, name) {
  const a = document.createElement("a");
  a.href = window.URL.createObjectURL(blob);
  a.download = name;
  a.click();
}
