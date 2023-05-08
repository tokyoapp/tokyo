// import '@uncut/gyro/components/CookieDisclaimer';

import { ProgressBar } from "./components/Progressbar";

window.log = (...str) => {
  new Gyro.Notification({ text: str.join(" "), time: 2000 }).show();
  console.log(...str);
};

window.warn = window.log;
window.error = window.log;

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
      {
        name: "file.export",
        description: "Export 3D Scene",
        shortcut: "Ctrl+E",
        async onAction() {
          if (lastModel) {
            const sceneObjects = scene.getRenderableObjects().map((geo) => geo.rawData);
            sceneObjects.name = lastModel.name;

            const gltfFile = GLTFFile.fromGeometry({
              prop: sceneObjects,
            });

            const gltfBlob = await gltfFile.toBlob();

            downloadBlob(gltfBlob, lastModel.name + ".gltf");
          } else {
            new Gyro.Notification({
              text: "No model to export. Scene is empty.",
              time: 4000,
            }).show();
          }
        },
      },
    ];
    window.addEventListener("DOMContentLoaded", (e) => init());
  }
}

let lastModel = null;

function makeRenderableMesh(mesh) {
  mesh.normals = mesh.normals.map((n) => [-n[0], -n[1], -n[2]]);

  const texture = mesh.material ? mesh.material.texture : null;
  let material;

  if (texture) {
    material = new DefaultMaterial({
      diffuseColor: [0.0, 0.0, 0.0, 1.0],
      texture: new Texture(texture.imageData, texture.format, false),
    });
  } else {
    material = new DefaultMaterial({});
  }

  const globalScale = 0.025;

  if (!mesh.position) {
    mesh.position = [0, 0, 0];
  }
  if (!mesh.rotation) {
    mesh.rotation = [0, 0, 0];
  }
  if (!mesh.origin) {
    mesh.origin = [0, 0, 0];
  }
  if (!mesh.scale) {
    mesh.scale = [1, 1, 1];
  }

  const geo = new Geometry({
    position: [
      mesh.position[0] * globalScale,
      mesh.position[1] * globalScale,
      mesh.position[2] * globalScale,
    ],
    rotation: [
      (mesh.rotation[0] * Math.PI) / 180,
      (mesh.rotation[2] * Math.PI) / 180,
      (-mesh.rotation[1] * Math.PI) / 180,
    ],
    origin: [
      mesh.origin[0] * globalScale,
      mesh.origin[1] * globalScale,
      mesh.origin[2] * globalScale,
    ],
    indecies: mesh.indices.reverse(),
    vertecies: mesh.vertecies,
    uvs: mesh.uvs,
    normals: mesh.normals,
    material: material,
    scale: [mesh.scale[0] * globalScale, mesh.scale[1] * globalScale, mesh.scale[2] * globalScale],
  });

  geo.rawData = mesh;
  geo.name = mesh.name;

  return geo;
}

let scene;
let progressbar;
let filesystem;

let audio;

async function playAudioFile(file) {
  if (audio) {
    audio.pause();
    audio.remove();
    audio = null;
  }

  audio = new Audio();
  audio.controls = true;
  audio.volume = 0.5;
  const audioSource = await filesystem.getFile(file.name);
  const fileBuffer = await audioSource.arrayBuffer();
  const blob = new Blob([fileBuffer]);
  audio.src = URL.createObjectURL(blob);
  audio.oncanplay = () => {
    audio.play();
  };
  audio.onended = () => {
    audio.remove();
  };
  audio.style.position = "fixed";
  audio.style.bottom = "20px";
  audio.style.left = "50%";
  audio.style.width = "500px";
  audio.style.transform = "translate(-50%, 0)";
  audio.style.zIndex = "100000";

  document.body.append(audio);
}

function init() {
  const outliner = document.querySelector("gyro-outliner");
  const explorer = document.querySelector("gyro-explorer");
  const viewport = document.querySelector("vs-viewport");

  viewport.viewport.renderer.background = [0, 0, 0, 0];

  explorer.setFilter("name", /\.mdl|\.bsp|\.gltf|\.wav/g);

  scene = new Scene();
  viewport.setScene(scene);

  outliner.setRoot(scene);

  let sceneChange = null;

  viewport.viewport.scheduler.addTask(
    new Task(() => {
      if (!sceneChange || sceneChange !== scene.lastchange) {
        outliner.updateScene();
        sceneChange = scene.lastchange;
      }
    })
  );

  filesystem = new VirtualFileSystem();
  const propLoader = new PropLoader(filesystem);
  const mapLoader = new MapLoader(filesystem);

  window.virtualFileSystem = filesystem;

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

  async function importModelFile(file) {
    fileInfo.innerHTML = "";

    progressbar = new ProgressBar();
    progressbar.slot = "hud";
    viewport.appendChild(progressbar);

    if (file.name.match(/\.wav/g)) {
      // sound file
      playAudioFile(file);
    } else if (file.type == "map") {
      const mapName = file.name.replace(".bsp", "");
      const mapgeo = await mapLoader.loadMap(mapName);

      lastModel = mapgeo;
      lastModel.name = mapName;

      log("Done decompiling!");

      progressbar.log("Loading map geometry...");
      for (let geo of mapgeo.map) {
        loadMesh(geo);
      }
      progressbar.log("Loading prop_dynamic meshes...");
      for (let geo of mapgeo.prop_dynamic) {
        loadMesh(geo);
      }
      progressbar.log("Loading prop_static meshes...");
      for (let geo of mapgeo.prop_static) {
        loadMesh(geo);
      }
    }

    if (file.type == "model") {
      let error = false;

      const meshes =
        (await propLoader
          .loadProp(file.path)
          .then((meshes) => {
            fileInfo.innerHTML = `
                    ${file.type}<br/>
                    ${file.name}<br/>
                    ${file.path}
                `;

            return meshes;
          })
          .catch((err) => {
            // new Gyro.Notification({ text: err.message, time: 5000 }).show();
            console.error(err);
            error = true;
          })) || [];

      progressbar.setProgress(30);

      if (error) return;

      lastModel = meshes;
      lastModel.name = file.name;

      for (let mesh of meshes) {
        progressbar.setProgress((progressbar.progress / meshes.length) * meshes.indexOf(mesh) * 70);
        loadMesh(mesh, meshes.indexOf(mesh));
      }
    }

    function loadMesh(mesh) {
      progressbar.log("Loading mesh " + mesh.name);

      const geo = makeRenderableMesh(mesh);
      scene.add(geo);
    }

    progressbar.log("Done loading.");
    progressbar.setProgress(100);
  }

  explorer.addEventListener("addfile", (e) => importModelFile(e.file));
  explorer.addEventListener("openfile", (e) => openFile(e.file));

  toggleGridBtn.addEventListener("click", (e) => {
    const config = viewport.viewport.renderer.renderConfig;
    config.setValue("show.grid", !config.getValue("show.grid"));
    config.save();
  });

  resetViewBtn.addEventListener("click", (e) => {
    viewport.viewport.controller.reset();
  });

  normalView.addEventListener("click", (e) => {
    Config.global.setValue("view_normal", !Config.global.getValue("view_normal"));
    Config.global.setValue("view_uv", false);
    Config.global.save();
  });

  uvView.addEventListener("click", (e) => {
    Config.global.setValue("view_uv", !Config.global.getValue("view_uv"));
    Config.global.setValue("view_normal", false);
    Config.global.save();
  });

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
    importValidFiles(openFilesButton.files);
  });

  async function importBSPPakfile(file) {
    const buffer = await file.arrayBuffer();

    try {
      const bsp = BSPFile.fromDataArray(buffer);

      await filesystem.attatchPakfile(bsp.pakfile.buffer);
      const tree = filesystem.getTree();
      tree.uncollapsed = true;
      tree.name = file.name + "/pakfile";
      tree.tools = [
        {
          icon: "SaveAs",
          name: "Extract files",
          action() {
            const pakBlob = new Blob([bsp.pakfile.buffer], { type: "binary" });
            downloadBlob(pakBlob, file.name + "_pakfile.zip");
          },
        },
      ];

      explorer.setRoot(tree);
      explorer.render();
    } catch (err) {
      log(err.message);
      console.error(err);
    }
  }

  async function importVPKArchives(filesArray) {
    const allFiles = filesArray;

    let vpk;

    for (let file of allFiles) {
      if (file.name.match("_dir")) {
        const buffer = await file.arrayBuffer();
        vpk = VPKFile.fromDataArray(buffer);

        await filesystem.attatchVPKFile(vpk);
        const tree = filesystem.getTree();
        tree.uncollapsed = true;
        tree.name = file.name;

        explorer.setRoot(tree);
        explorer.update();
      }
    }

    if (!vpk) {
      throw new Error("No _dir.vpk");
    }

    for (let file of allFiles) {
      if (!file.name.match("_dir")) {
        const parts = file.name.split("_");
        const index = parseInt(parts[parts.length - 1]);
        vpk.addArchive(index, file);
      }
    }
  }

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
      }
    }

    const tree = filesystem.getTree();
    tree.name = "Root";
    tree.uncollapsed = true;

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
