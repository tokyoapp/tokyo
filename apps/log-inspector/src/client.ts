import "./components/LogViewer.js";
import { VirtualFileSystem, LokalFilesystem } from "filesystem";

const openFilesButton = document.createElement("input");
openFilesButton.type = "file";

export class Client {
  constructor() {
    this.actions = [
      {
        name: "files.open",
        description: "Import model files",
        shortcut: "Ctrl+Shift+I",
        onAction() {
          openFilesButton.click();
        },
      },
      {
        name: "file.open",
        description: "Open Folder",
        shortcut: "Ctrl+Shift+O",
        async onAction() {
          const dirs = await LokalFilesystem.openDirectoryChooser();
          const dir = dirs[0];
          const entires = dir.entries();
          console.log(await entires.next());
        },
      },
    ];
    window.addEventListener("DOMContentLoaded", (e) => init());
  }
}

let progressbar;
const filesystem = new VirtualFileSystem();

async function init() {
  showLoading();

  const explorer = document.querySelector("gyro-explorer");
  // explorer.setFilter("name", /\.mdl|\.bsp|\.gltf|\.wav/g);

  if (!explorer) throw new Error("explorere not initialised");

  async function openDir(dirEntry) {
    const handle = dirEntry.file;
    console.log(dirEntry, handle);
    const tree = LokalFilesystem.getTree(handle);
    console.log(tree);
  }

  async function openFile(file) {
    if (progressbar) progressbar.remove();
    if (!file) return;

    if (file.type == "folder") {
      file.uncollapsed = !file.uncollapsed;
      explorer?.render();
    } else {
      const f = await filesystem.getFile(file.name);
      if (f) {
        console.log(f);
        const contentItter = f.itter();
        console.log(contentItter);

        window.dispatchEvent(new CustomEvent("file", { detail: { itter: contentItter } }));
      }
    }
  }

  explorer.addEventListener("openfile", (e) => openFile(e.file));

  openFilesButton.addEventListener("change", async (e) => {
    importValidFiles(e.target.files);
  });

  const decoder = new TextDecoder();

  async function* readerItteraotr(reader) {
    let finished = false;
    while (!finished) {
      const res = await reader.read();
      const value = decoder.decode(res.value);
      finished = res.done;
      const arg = yield value;
      // arg is the arguemnt passed to next function
    }
  }

  async function importValidFiles(filesArray: File[]) {
    for (const file of filesArray) {
      if (file.name.match(/[\.vvd$|\.mdl$|\.vtx$|\.vmt$|\.bsp$|\.gltf$]/g)) {
        const entry = file.webkitRelativePath || file.name;
        filesystem.fileRegistry[entry.toLocaleLowerCase()] = {
          file: entry,
          async arrayBuffer() {
            return file.arrayBuffer();
          },

          itter() {
            return readerItteraotr(file.stream().getReader());
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

  const list = await LokalFilesystem.getFileList();
  const dir = list[0];
  openDir(dir);
}

function showLoading() {
  document.body.setAttribute("loading", "");
}

function hideLoading() {
  document.body.removeAttribute("loading");
}

const client = new Client();

export const actions = client.actions;
