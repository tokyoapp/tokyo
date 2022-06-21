import { Media } from "./../modules/Media";
import fs from "../modules/filesystem";

import { log } from "../log";

import * as FFMPEG from "@ffmpeg/ffmpeg";
import exrSeqToWebm from "../modules/ffmpeg/configs/exrSeqToWebm";

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

async function convertFiles(media) {
  const item: Media = media[0];

  const files = item.files;
  const fileEntry = item.template;
  const frameRange = item.frames;

  const ffmpeg = FFMPEG.createFFmpeg({
    corePath: "/ffmpeg-core.js",
    log: __IS_DEBUG__,
    logger: ({ message }) => {
      log(message);
    },
  });

  if (fileEntry && frameRange && frameRange.length > 1 && frameRange[0]) {
    const firstFrame = frameRange[0].toString();

    const fps = item.framerate || 24;
    const args = exrSeqToWebm(fileEntry, firstFrame, fps, true);

    await ffmpeg.load();

    console.log("Buffer files");

    for (let file of files) {
      const buffer = await file.arrayBuffer();
      ffmpeg.FS("writeFile", file.name, new Uint8Array(buffer));
    }

    console.log("Run ffmpeg");

    await ffmpeg.run(...args);
    const data = ffmpeg.FS("readFile", "output.webm");
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
}

export default async function (files: FileList) {
  if (files.length == 0 || !files[0]) return;

  // check if it contains a sequence and stack those frames
  const stacks = {};
  const stackedMedia: Media[] = [];

  // ittereate and sort all files
  for (let file of files) {
    const template = file.name.match(/[0-9]+/);
    let padding = 4;
    if (template) {
      padding = template.toString().length;
    }

    const frameTemplate = `%0${padding}d`;
    const seqNeutralFileName = getNameTemplate(file.name, frameTemplate);

    if (!stacks[seqNeutralFileName]) {
      stacks[seqNeutralFileName] = [];
    }

    stacks[seqNeutralFileName].push(file);
    stacks[seqNeutralFileName].template = frameTemplate;
  }

  // organize into stacks with metadata
  for (let name in stacks) {
    const stack = stacks[name];
    const frameRange = frameRangeOfSeq(stack.map((file) => file.name));
    const firstFrame = frameRange[0].toString();
    const lastFrame = frameRange[1].toString();

    const itemName = name.replace(
      stack.template,
      `[${firstFrame}..${lastFrame}]`
    );

    stackedMedia.push({
      name: itemName,
      template: name,
      frames: frameRange,
      framerate: 24,
      type: itemName.split(".").reverse()[0] || "",
      files: [...stack],
    });
  }

  await fs.add(stackedMedia);

  // organize files
  //  put sequences together into one item
  //  analyze files and read meta data

  const output = await convertFiles(stackedMedia);

  if (output) {
    const outputFile = new File([output], "output.webm", {});
    await fs.add([{ name: "output.webm", type: "webm", files: [outputFile] }]);

    console.log("MEDIA", await fs.list());
  } else {
    throw new Error("Conversion failed");
  }
}
