export function exec() {
  const mimeType = "image/webp";

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  document.body.append(canvas);

  const animate = () => {
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "red";
    context.fillRect(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      20,
      20
    );

    requestAnimationFrame(animate);
  };

  const mediaRecorder = new MediaRecorder(canvas.captureStream(24), {
    mimeType: mimeType,
  });

  setTimeout(() => {
    animate();
    mediaRecorder.start();
    console.log("recorder started");
  }, 1000);

  setTimeout(() => {
    mediaRecorder.stop();
    console.log(mediaRecorder.state);
    console.log("recorder stopped");
  }, 6000);

  const chunks: Blob[] = [];

  mediaRecorder.onstop = function (e) {
    const blob = new Blob(chunks);
    console.log("recorder stopped");

    console.log(blob);
    const a = document.createElement("a");
    a.download = "test.webp";
    a.href = URL.createObjectURL(blob);
    a.click();
  };

  mediaRecorder.ondataavailable = function (e) {
    chunks.push(e.data);
  };
}
