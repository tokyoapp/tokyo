import fs from "../modules/filesystem";

import { log } from "../log";

import * as FFMPEG from "@ffmpeg/ffmpeg";

async function convertFiles(files) {
  const ffmpeg = FFMPEG.createFFmpeg({
    corePath: "/ffmpeg-core.js",
    log: __IS_DEBUG__,
    logger: ({ message }) => {
      log(message);
    },
  });

  // ffmpeg -apply_trc iec61966_2_1 -start_number 1100 -i input%04d.exr output.mp4

  const args = [
    "-i",
    "%04d.exr",
    "-start_number",
    "0001",
    "-pix_fmt",
    "yuv420p",
    "-vcodec",
    "libwebp",
    "-loop",
    "0",
    "output.webp",
  ];

  // image sequence to video:
  // ffmpeg -r 1/5 -i img%03d.png -c:v libx264 -vf fps=25 -pix_fmt yuv420p out.mp4

  await ffmpeg.load();

  console.log("Buffer files");

  for (let file of files) {
    const buffer = await file.arrayBuffer();
    ffmpeg.FS("writeFile", file.name, new Uint8Array(buffer));
  }

  console.log("Run ffmpeg");

  await ffmpeg.run(...args);
  const data = ffmpeg.FS("readFile", "output.webp");
  const blob = new Blob([data.buffer]);

  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.src = url;
  document.body.append(img);
}

export default function (files: FileList) {
  // fs.add(files);

  convertFiles(files);
}
