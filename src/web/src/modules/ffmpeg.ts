// https://github.com/ffmpegwasm/ffmpeg.wasm

const toWebpP = {
  args: ["-i", "video.avi", "-vcodec", "libwebp", "-loop", "0", "video.webp"],
  inFilename: "video.avi",
  outFilename: "video.webp",
  mediaType: "video/mp4",
};
