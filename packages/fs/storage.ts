async function hashBuffer(buffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

async function writeFile(name, data) {
  const root = await navigator.storage.getDirectory();

  const fileHandle = await root.getFileHandle(name, {
    create: true,
  });

  console.log("Write file", name, data);

  const writeable = await fileHandle.createWritable();
  await writeable.write(data);
  await writeable.close();
}

export async function writeBuffer(buffer): Promise<string> {
  // await navigator.storage.persist();

  const hash = await hashBuffer(buffer);
  await writeFile(hash, buffer);

  // await clearDirectory(root);

  return hash;
}

export async function listFiles(
  dir: FileSystemDirectoryHandle
): Promise<Array<[string, FileSystemFileHandle]>> {
  const files: Array<[string, FileSystemFileHandle]> = [];

  const entires = dir.entries();
  let done = false;

  while (!done) {
    const file = await entires.next();
    done = file.done;

    if (!done) {
      files.push(file.value);
    }
  }

  return files;
}

async function clearDirectory(dir: FileSystemDirectoryHandle) {
  const entires = dir.entries();
  let done = false;

  while (!done) {
    const file = await entires.next();
    done = file.done;

    if (!done) {
      const value = file.value;
      const name = value[1].name;

      dir.removeEntry(name);
      console.log("Deleted file", name);
    }
  }
}
