import { getNameTemplate, MediaFile } from "../storage/MediaFile";
import { Media } from "../storage/Media";
import fs from "filestorage";

export async function handleFiles(files: FileList) {
  if (files.length == 0 || !files[0]) return;

  // check if it contains a sequence and stack those frames
  const stacks = {};

  // ittereate and sort all files
  for (let file of files) {
    const template = file.name.match(/[0-9]+/);
    let padding = 4;
    if (template) {
      padding = template.toString().length;
    }

    const frameTemplate = `%0${padding}d`;
    const seqNeutralFileName = getNameTemplate(file.name, frameTemplate);

    if (!stacks[seqNeutralFileName]) {
      stacks[seqNeutralFileName] = [];
    }

    stacks[seqNeutralFileName].push(file);
    stacks[seqNeutralFileName].template = frameTemplate;
  }

  const stackedMedia: Media[] = [];

  // organize into stacks with metadata
  for (let name in stacks) {
    const stack = stacks[name];

    console.log(name);

    const mediaFile = new MediaFile([...stack]);
    mediaFile.template = name;
    console.log(mediaFile);

    stackedMedia.push(mediaFile);
  }

  await fs.add(stackedMedia);

  // organize files
  //  put sequences together into one item
  //  analyze files and read meta data

  // const outputFile = await convertFiles(stackedMedia);

  // if (outputFile) {
  //   await fs.add([outputFile]);
  // } else {
  //   throw new Error("Conversion failed");
  // }
}
