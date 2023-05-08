// index.js
import { html } from "lit-element";
import LokalFilesystem from "./src/LokalFilesystem";
import DataHandler from "./src/DataHandler";

export * from "./src/VirtualFilesystem.js";

export { LokalFilesystem, DataHandler };

export class FileSystemEvent extends Event {
  files: Array<File>;

  constructor(files: Array<File>) {
    super("file-system-lib.open");
    this.files = files;
  }
}

async function updateRecentsList() {
  const list = await LokalFilesystem.getFileList();

  menu[0].options = [
    ...FileSystemLib.menuOptions,
    { title: "Recent Items", seperator: true },
    ...list
      .sort((a, b) => b.created - a.created)
      .slice(0, 5)
      .map((item) => ({
        title: item.file.name,
        action: {
          name: "file-system-lib.open.recent",
          args: {
            file_id: item.file.name,
          },
        },
      })),
  ];

  const menuEle = document.querySelector("gyro-menubar");
  if (menuEle) {
    menuEle.update();
  }
}

const menu = [
  {
    title: "Import files",
    icon: "File",
    options: [],
  },
];

export default class FileSystemLib {
  static options = {
    multiple: true,
  };

  static menuOptions = [
    {
      title: "Open",
      action: "file-system-lib.open",
    },
  ];

  static title = "file-system-lib";
  static components = [];

  static menu = menu;

  static actions = [
    {
      name: "file-system-lib.open",
      description: "Open files",
      shortcut: "Ctrl+O",
      onAction: (args, event, action) => {
        const externalOptions = args[0];

        if (externalOptions.directory) {
          LokalFilesystem.openDirectoryChooser().then((dirs) => {
            const fsevent = new FileSystemEvent(dirs);
            window.dispatchEvent(fsevent);
          });
        } else {
          const optns = Object.assign(FileSystemLib.options, externalOptions);
          LokalFilesystem.openFileChooser(optns).then((files) => {
            const fsevent = new FileSystemEvent(files);
            window.dispatchEvent(fsevent);
          });
        }
      },
    },
    {
      name: "file-system-lib.open.recent",
      description: "Open recent files",
      onAction: async ([recentFile], event, action) => {
        const file = await LokalFilesystem.openFileById(recentFile.file_id);
        const fsevent = new FileSystemEvent([file]);
        window.dispatchEvent(fsevent);
      },
    },
  ];

  static settings = {
    title: "Files",
    icon: "File",
    content: () => {
      return html`
        <style>
          .row {
            font-size: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 500px;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }
          .row.header {
            padding: 8px 0;
            margin: 0 0 20px 0;
            border-radius: 4px;
            border: none;
            opacity: 0.5;
          }
        </style>
        <div class="row header">File System</div>
        <div class="row">
          <label>Display recent files in menu</label>
          <input-switch></input-switch>
        </div>
      `;
    },
  };
}

window.addEventListener("file-system-lib.open", (e) => {
  updateRecentsList();
});

requestAnimationFrame(() => {
  updateRecentsList();
});
