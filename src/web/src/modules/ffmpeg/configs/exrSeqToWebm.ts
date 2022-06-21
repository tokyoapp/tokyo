// exr seq to webm
// ffmpeg -framerate 25 -gamma 2 -f image2 -i ./%04d.exr -c:v libvpx -auto-alt-ref 0 follow.webm

export default function (
  fileEntry: string,
  firstFrame: string,
  fps: number = 24,
  loop: boolean
) {
  const outputFile = "output.webm";

  return {
    args: [
      "-framerate",
      fps.toString(),
      "-start_number",
      firstFrame,
      "-gamma",
      "2.2",
      // "-f",
      // "image2",
      "-i",
      fileEntry,
      "-auto-alt-ref",
      "0",
      "-c:v",
      "libvpx",
      "-loop",
      loop === false ? "1" : "0",
      outputFile,
    ],
    format: "webm",
  };
}
