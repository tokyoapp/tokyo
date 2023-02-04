// exr seq to webm
// ffmpeg -framerate 25 -gamma 2 -f image2 -i ./%04d.exr -c:v libvpx -auto-alt-ref 0 follow.webm

export default function (
  fileEntry: string,
  firstFrame: string,
  fps: number = 24,
  loop: boolean
) {
  const outputFile = "frame_%04d.webp";

  return {
    args: [
      "-gamma",
      "2.2",
      "-i",
      fileEntry,
      "-vf",
      `fps=${fps.toString()}`,
      "-start_number",
      firstFrame,
      "-auto-alt-ref",
      "0",
      "-c:v",
      "libwebp",
      outputFile,
    ],
    format: "webp",
  };
}
