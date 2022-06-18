// https://github.com/ffmpegwasm/ffmpeg.wasm
import * as FFMPEG from "@ffmpeg/ffmpeg";

async function main() {
  const ffmpeg = FFMPEG.createFFmpeg({
    corePath: "/ffmpeg-core.js",
    log: __IS_DEBUG__,
  });

  const toWebpP = {
    args: ["-i", "video.avi", "-vcodec", "libwebp", "-loop", "0", "video.webp"],
    inFilename: "video.avi",
    outFilename: "video.webp",
    mediaType: "video/mp4",
  };

  // image sequence to video:
  // ffmpeg -r 1/5 -i img%03d.png -c:v libx264 -vf fps=25 -pix_fmt yuv420p out.mp4

  await ffmpeg.load();
  // ffmpeg.FS("writeFile", toWebpP.inFilename, await fetchFile("./test.avi"));
  // await ffmpeg.run(...toWebpP.args);
  // const data = ffmpeg.FS("readFile", "output.mp4");
  // const blob = new Blob([data.buffer], { type: "video/mp4" });
}

main();
