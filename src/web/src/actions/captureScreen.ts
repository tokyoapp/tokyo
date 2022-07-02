import fs from "../modules/filesystem";

export async function startCapture() {
  let captureStream: MediaStream | null = null;

  const displayMediaOptions = {
    video: { width: 1920, height: 1080 },
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

  const chunks: Blob[] = [];

  if (captureStream) {
    const mediaRecorder = new MediaRecorder(captureStream, {
      mimeType: "video/webm",
    });

    mediaRecorder.start();

    setTimeout(() => {
      mediaRecorder.stop();
    }, 5 * 1000);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks);
      const buffer = await blob.arrayBuffer();
      const hash = await fs.saveBuffer(buffer);
      console.log("buffer hash:", hash);

      setTimeout(async () => {
        fs.list().then(async (list) => {
          console.log(list);

          for (let [name, file] of list) {
            if (name === hash) {
              const f = await file.getFile();

              console.log(f);

              const buff = await f.arrayBuffer();

              console.log(buff);

              const blob = new Blob([buff], { type: "video/webm" });

              console.log(blob);

              const video = document.createElement("video");
              video.src = URL.createObjectURL(blob);
              video.oncanplay = video.play;

              document.body.append(video);
            }
          }
        });
      }, 5 * 1000);
    };

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };
  }

  document.body.append(video);

  return captureStream;
}
