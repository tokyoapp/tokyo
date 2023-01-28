// image sequence to video:
// ffmpeg -r 1/5 -i img%03d.png -c:v libx264 -vf fps=25 -pix_fmt yuv420p out.mp4

export default function (
  fileEntry: string,
  firstFrame: string,
  fps: number = 24,
  loop: boolean
) {
  const outputFile = "output.mp4";

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
      "libx264",
      "-loop",
      loop === false ? "1" : "0",
      outputFile,
    ],
    format: "mp4",
  };
}
