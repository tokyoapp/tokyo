// png seq to webm
// ffmpeg -framerate 25 -f image2 -i ./%04d.png -c:v libvpx -auto-alt-ref 0 -pix_fmt yuva420p output.webm

export default function (
  fileEntry: string,
  firstFrame: string,
  fps: number = 24,
  loop: boolean
) {
  const outputFile = "output.webm";

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
      "libvpx-vp9",
      "-loop",
      loop === false ? "1" : "0",
      outputFile,
    ],
    format: "webm",
  };
}
