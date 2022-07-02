import { Media } from "./../Media";
// https://github.com/ffmpegwasm/ffmpeg.wasm
import * as FFMPEG from "@ffmpeg/ffmpeg";
import exrSeqToWebm from "./configs/exrSeqToWebm";
import { log } from "../../log";
import pngSeqToWebp from "./configs/pngSeqToWebp";
import exrSeqToWebpSeq from "./configs/exrSeqToWebpSeq";

export async function convertFiles(media) {
  const item: Media = media[0];

  const type = item.type;

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

  if (
    fileEntry &&
    frameRange &&
    frameRange.length > 1 &&
    frameRange[0] != null &&
    frameRange[1] != null
  ) {
    const firstFrame = frameRange[0].toString();

    const fps = item.framerate || 24;

    const argTypeMap = {
      exr() {
        return exrSeqToWebpSeq(fileEntry, firstFrame, fps, true);
      },
      png() {
        return pngSeqToWebp(fileEntry, firstFrame, fps, true);
      },
    };

    const conv = argTypeMap[type]();
    const format = conv.format;
    const args = conv.args;

    await ffmpeg.load();

    console.log("Buffer files");

    for (let file of files) {
      const buffer = await file.arrayBuffer();
      ffmpeg.FS("writeFile", file.name, new Uint8Array(buffer));
    }

    console.log("Run ffmpeg");

    const outputFiles: Blob[] = [];

    await ffmpeg.run(...args);

    for (let frame = frameRange[0]; frame < frameRange[1]; frame++) {
      try {
        const data = ffmpeg.FS(
          "readFile",
          `frame_${frame.toString().padStart(4, "0")}.${format}`
        );
        const blob = new Blob([data.buffer]);
        outputFiles.push(blob);
      } catch (err) {
        console.log(err);
      }
    }

    // const url = URL.createObjectURL(blob);

    // const img = new Image();
    // img.src = url;
    // document.body.append(img);

    // const video = document.createElement("video");
    // video.src = url;
    // document.body.append(video);

    return new File(outputFiles, `output.${format}`, {});
  }
}
