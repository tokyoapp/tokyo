import fs from "../modules/filesystem";

import { log } from "../log";

import * as FFMPEG from "@ffmpeg/ffmpeg";

function getNameTemplate(name, template = "####") {
  return name.replace(/[0-9]+/, template);
}

function frameRangeOfSeq(seq: string[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;

  for (const file of seq) {
    try {
      if (file) {
        const f = file.match(/[0-9]+/g);
        if (f) {
          const n = parseInt(f.toString());
          min = Math.min(n, min);
          max = Math.max(n, max);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  return [min, max];
}

async function convertFiles(files) {
  const ffmpeg = FFMPEG.createFFmpeg({
    corePath: "/ffmpeg-core.js",
    log: __IS_DEBUG__,
    logger: ({ message }) => {
      log(message);
    },
  });

  const template = files[0].name.match(/[0-9]+/g);
  let padding = 4;
  if (template) {
    padding = template.toString().length;
  }

  const frameTemplate = `%0${padding}d`;
  const fileEntry = getNameTemplate(files[0].name, frameTemplate);
  const frameRange = frameRangeOfSeq([...files].map((file) => file.name));
  const firstFrame = frameRange[0].toString();
  const lastFrame = frameRange[1].toString();

  const itemName = fileEntry.replace(
    frameTemplate,
    `[${firstFrame}..${lastFrame}]`
  );

  console.log("ITEM ", itemName);

  log(`Converting files ${fileEntry} from frame ${firstFrame}.`);
  console.log(`Converting files ${fileEntry} at frame ${firstFrame}.`);

  // ffmpeg -apply_trc iec61966_2_1 -start_number 1100 -i input%04d.exr output.mp4

  const outputFile = "output.webm";

  const args = [
    "-i",
    fileEntry,
    "-start_number",
    firstFrame.padStart(padding, "0"),
    "-pix_fmt",
    "yuv420p",
    "-vcodec",
    "libvpx-vp9",
    "-loop",
    "0",
    outputFile,
  ];

  // image sequence to video:
  // ffmpeg -r 1/5 -i img%03d.png -c:v libx264 -vf fps=25 -pix_fmt yuv420p out.mp4

  // png seq to webm
  // ffmpeg -framerate 25 -f image2 -i ./%04d.png -c:v libvpx -auto-alt-ref 0 -pix_fmt yuva420p output.webm

  await ffmpeg.load();

  console.log("Buffer files");

  for (let file of files) {
    const buffer = await file.arrayBuffer();
    ffmpeg.FS("writeFile", file.name, new Uint8Array(buffer));
  }

  console.log("Run ffmpeg");

  await ffmpeg.run(...args);
  const data = ffmpeg.FS("readFile", outputFile);
  const blob = new Blob([data.buffer]);

  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.src = url;
  document.body.append(img);

  const video = document.createElement("video");
  video.src = url;
  document.body.append(video);

  return blob;
}

export default async function (files: FileList) {
  if (files.length == 0 || !files[0]) return;

  await fs.add([...files]);

  // check if it contains a sequence and stack those frames

  const template = files[0].name.match(/[0-9]+/g);
  let padding = 4;
  if (template) {
    padding = template.toString().length;
  }

  const frameTemplate = `%0${padding}d`;
  const fileEntry = getNameTemplate(files[0].name, frameTemplate);
  const frameRange = frameRangeOfSeq([...files].map((file) => file.name));
  const firstFrame = frameRange[0].toString();
  const lastFrame = frameRange[1].toString();

  const itemName = fileEntry.replace(
    frameTemplate,
    `[${firstFrame}..${lastFrame}]`
  );

  console.log(itemName);

  // organize files
  //  put sequences together into one item
  //  analyze files and read meta data

  const output = await convertFiles(await fs.list());
  const file = new File([output], "output.webm", {});
  await fs.add([file]);
}
