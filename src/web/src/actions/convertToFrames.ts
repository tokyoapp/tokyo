import { MediaFile } from "./../modules/storage/MediaFile";
import fs from "../modules/filesystem";
import MP4Box from "mp4box";

export async function convert() {
  const [_, handle] = await (
    await fs.list()
  ).find((file) => file[0] === "cap.mp%01d");

  const file = await handle.getFile();
  const buffer = await file.arrayBuffer();
  console.log(file, buffer);

  const video = document.createElement("video");
  video.src = URL.createObjectURL(file);

  video.oncanplay = () => {
    function handleFrame(frame) {
      console.log(frame);
    }

    const config = {
      codec: "vp8",
      codedWidth: video.videoWidth,
      codedHeight: video.videoHeight,
    };

    const mp4boxfile = MP4Box.createFile();
    mp4boxfile.onError = function (e) {
      console.error(e);
    };
    mp4boxfile.onReady = function (info) {
      console.log(info);
    };
    mp4boxfile.onMoovStart = function (info) {
      console.log("Starting to receive File Information", info);
    };

    buffer.fileStart = 0;
    mp4boxfile.appendBuffer(buffer);

    mp4boxfile.start();
    mp4boxfile.flush();

    // const demuxer = new

    // const decoder = new VideoDecoder({
    //   output: onFrame, // the callback to handle all the VideoFrame objects
    //   error: e => console.error(e),
    // });
    // decoder.configure(config); // depends on the input file, your demuxer should provide it
    // demuxer.start((chunk) => { // depends on the demuxer, but you need it to return chunks of video data
    //   decoder.decode(chunk); // will trigger our onFrame callback
    // })
  };
}
