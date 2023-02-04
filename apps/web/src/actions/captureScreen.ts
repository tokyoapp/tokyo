import { MediaFile } from "./../modules/storage/MediaFile";
import fs from "../modules/filesystem";

import { GIFEncoder, quantize, applyPalette } from "gifenc";

let captureStream: MediaStream | null = null;
let recording: boolean = false;

let chunks: ImageData[] = [];

export function stopCapture() {
  recording = false;
  console.log(chunks);

  const cnvs = document.createElement("canvas");
  const ctx = cnvs.getContext("2d");
  if (!ctx) throw new Error("no ctx");

  const gif = GIFEncoder();

  if (chunks[0]) {
    const palette = quantize(chunks[0].data, 256);

    for (let frame of chunks) {
      const index = applyPalette(frame.data, palette);
      gif.writeFrame(index, frame.width, frame.height, { palette });
    }

    gif.finish();
    const output = gif.bytes();

    console.log(output);

    const blob = new Blob([output], { type: "image/gif" });
    console.log("output", blob);

    //download blob
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cap.gif";
    a.click();
  }
}

export async function startCapture() {
  recording = true;

  const displayMediaOptions = {
    video: { width: 1920, height: 1080, frameRate: 60 },
  };

  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    );
  } catch (err) {
    console.error("Error: " + err);
  }

  const video = document.createElement("video");
  video.oncanplay = () => {
    video.play();
  };
  video.srcObject = captureStream;

  const canvas = document.createElement("canvas");

  const captureFrame = async () => {
    const ar = video.videoWidth / video.videoHeight;
    canvas.width = 680 * ar;
    canvas.height = 680;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      chunks.push(data);
    }
  };

  const loop = () => {
    captureFrame();

    if (recording) {
      setTimeout(loop, 1000 / 30);
    }

    console.log(chunks.length);
  };
  loop();

  document.body.append(canvas);

  return captureStream;
}
