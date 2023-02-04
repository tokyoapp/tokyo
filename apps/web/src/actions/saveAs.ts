import fs from "../modules/filesystem";

console.dir(fs);

export function saveAs() {
  fs.get("cap.mp%01d").then(async (file) => {
    const f = await file?.getFile();
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cap.mp4";
    a.click();
  });
}
