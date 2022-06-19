import fs from "../modules/filesystem";

import { log } from "../log";

import * as FFMPEG from "@ffmpeg/ffmpeg";

function getNameTemplate(name, template = "####") {
  return name.replace(/[0-9]+/g, template);
}

function firstFrameOfSeq(seq: string[]) {
  let min = Infinity;
  for (const file of seq) {
    try {
      if (file) {
        const f = file.match(/[0-9]+/g);
        if (f) {
          const n = parseInt(f.toString());
          min = Math.min(n, min);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
  return min;
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

  const fileEntry = getNameTemplate(files[0].name, `%0${padding}d`);
  const firstFrame = firstFrameOfSeq([...files].map((file) => file.name))
    .toString()
    .padStart(padding, "0");

  log(`Converting files ${fileEntry} from frame ${firstFrame}.`);
  console.log(`Converting files ${fileEntry} at frame ${firstFrame}.`);

  // ffmpeg -apply_trc iec61966_2_1 -start_number 1100 -i input%04d.exr output.mp4

  const outputFile = "output.webm";

  const args = [
    "-i",
    fileEntry,
    "-start_number",
    firstFrame,
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
}

export default function (files: FileList) {
  // fs.add(files);

  convertFiles(files);
}
