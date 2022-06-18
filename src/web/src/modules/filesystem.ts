const fsWorker = new Worker(
  new URL("../../../../packages/fs/worker.ts", import.meta.url),
  {
    type: "module",
  }
);

export default class fs {
  static add(files: FileList) {
    fsWorker.postMessage({ files: files });
  }
}
