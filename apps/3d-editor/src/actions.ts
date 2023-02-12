import Config from "atrium/lib/Config";
import Gyro from "atrium/lib/Gyro";

// config
Config.global.define("rendering.smooth", false, false);
Config.global.load();

// app functions
function resizeImage(imageObject, size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!Config.global.getValue("rendering.smooth")) {
    canvas.style.imageRendering = "pixelated";
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;
    context.imageSmoothingEnabled = false;
  } else {
    canvas.style.imageRendering = "optimizequality";
    context.mozImageSmoothingEnabled = true;
    context.webkitImageSmoothingEnabled = true;
    context.msImageSmoothingEnabled = true;
    context.imageSmoothingEnabled = true;
  }

  context.drawImage(imageObject, 0, 0, canvas.width, canvas.height);

  return canvas;
}

function saveImage(canvas, name) {
  canvas.toBlob((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name + ".png";
    a.click();
  });
}

function exportImages(sizes) {
  const editor = document.querySelector("gyro-emote-editor");
  const fileName = editor.getFileName();

  const imageOutput = editor.renderOutput();

  for (let size of sizes) {
    const image = resizeImage(imageOutput, size);
    saveImage(image, `${fileName}_${size}x${size}`);
  }
}

function importImage() {
  const input = document.createElement("input");
  input.type = "file";
  input.onchange = (e) => {
    const file = input.files[0];
    readFile(file);
  };
  input.click();
}

function readFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    createImage(e.target.result, file.name.split(".")[0]);
  };
  reader.readAsDataURL(file);
}

function createImage(url, name = "untitled") {
  const img = new Image();
  img.src = url;

  img.onload = () => {
    const editor = document.querySelector("gyro-emote-editor");
    editor.loadImage(img, name);

    window.dispatchEvent(new Event("preview.update"));
  };
}

// drag and drop

window.addEventListener("dragover", (e) => {
  e.preventDefault();
});

window.addEventListener("drop", (e) => {
  if (e.dataTransfer.items) {
    for (let item of e.dataTransfer.items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        importSource(file);
      } else if (item.type === "text/uri-list") {
        item.getAsString(async (string) => {
          const blob = await fetch(string)
            .then((r) => r.blob())
            .catch((err) => {
              console.error(err);
            });

          if (blob && blob.size > 0) {
            blob.name = "untitled";
            importSource(blob);
          } else {
            new Gyro.Notification({ text: "Failed loading image." }).show();
          }
        });
      }
    }
  }
});

function importSource(fileOrUrl) {
  if (fileOrUrl && typeof fileOrUrl == "string") {
    createImage(fileOrUrl);
  } else if (fileOrUrl) {
    readFile(fileOrUrl);
  } else {
    importImage();
  }
}

export default [
  {
    name: "export.maxres",
    description: "Export image with full resolution",
    onAction() {
      const editor = document.querySelector("gyro-emote-editor");
      exportImages([editor.width]);
    },
  },
  {
    name: "export.emotes",
    description: "Export emote images",
    shortcut: "Ctrl+E",
    onAction() {
      exportImages([28, 56, 112]);
    },
  },
  {
    name: "export.badges",
    description: "Export badge images",
    shortcut: "Ctrl+Shift+E",
    onAction() {
      exportImages([18, 36, 72]);
    },
  },
  {
    name: "import.image",
    description: "Import image",
    shortcut: "Ctrl+I",
    onAction([fileOrUrl]) {
      importSource(fileOrUrl);
    },
  },
  {
    name: "paste.image",
    description: "Paste image",
    shortcut: "Ctrl+V",
    onKeyDown: true,
    async onAction() {
      const items = await navigator.clipboard.read();

      const firstItem = items[0];
      const blob = await firstItem.getType("image/png").catch((err) => {
        new Gyro.Notification({ text: "Nothing to paste" }).show();
      });

      if (blob) {
        blob.lastModifiedDate = new Date();
        blob.name = "Untitled";

        importSource(blob);
      }
    },
  },
  {
    name: "editor.reset.rotation",
    description: "Reset canvas rotation",
    shortcut: "Ctrl+R",
    onAction() {
      const editor = document.querySelector("gyro-emote-editor");
      editor.setRotation(0);
    },
  },
  {
    name: "editor.reset.scale",
    description: "Reset editor scale",
    shortcut: "Ctrl+1",
    onAction() {
      const editor = document.querySelector("gyro-emote-editor");
      editor.setScale(1);
    },
  },
  {
    name: "editor.reset.crop",
    description: "Reset canvas crop",
    shortcut: "Ctrl+0",
    onAction() {
      const editor = document.querySelector("gyro-emote-editor");
      editor.setCrop(0, 0, editor.width, editor.height);
    },
  },
  {
    name: "editor.canvas.flip",
    description: "Flip canvas",
    shortcut: "Ctrl+F",
    onAction(action) {
      const editor = document.querySelector("gyro-emote-editor");
      editor.flipCanvas();
    },
  },
  {
    name: "undo",
    description: "Undo",
    shortcut: "Ctrl+Z",
    onAction: () => {
      const editor = document.querySelector("gyro-emote-editor");
      editor.undo();
    },
  },
  {
    name: "redo",
    description: "Redo",
    shortcut: "Ctrl+Y",
    onAction: () => {
      const editor = document.querySelector("gyro-emote-editor");
      editor.redo();
    },
  },
  {
    name: "publish.bttv",
    onAction: () => {
      window.open("https://betterttv.com/dashboard/emotes/upload");
    },
  },
  {
    name: "publish.ffz",
    onAction: () => {
      window.open("https://www.frankerfacez.com/emoticons/submit");
    },
  },
];
