export default function (
  fileEntry: string,
  firstFrame: string,
  fps: number = 24,
  loop: boolean
) {
  const outputFile = "output.webp";

  return {
    args: [
      "-i",
      fileEntry,
      "-vf",
      `fps=${fps}`,
      "-start_number",
      firstFrame,
      "-pix_fmt",
      "yuv420p",
      "-vcodec",
      "libwebp",
      "-loop",
      loop === false ? "1" : "0",
      outputFile,
    ],
    format: "webp",
  };
}
