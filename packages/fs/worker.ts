import fs from "./fs";

self.onmessage = (msg) => {
  for (let file of msg.data.files) {
    const { name, size, type } = file;
    const blob: Blob = file;

    console.log("adding", name);
    fs.createFile(name, file);
  }
};
