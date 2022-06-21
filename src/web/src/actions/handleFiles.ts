import { Media } from "./../modules/Media";
import fs from "../modules/filesystem";
import { convertFiles } from "../modules/ffmpeg/ffmpeg";
import { State } from "@luckydye/app-state";

function getNameTemplate(name, template = "####") {
  return name.replace(/[0-9]+/, template);
}

function frameRangeOfSeq(seq: string[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;

  for (const file of seq) {
    try {
      if (file) {
        const f = file.match(/[0-9]+/g);
        if (f) {
          const n = parseInt(f.toString());
          min = Math.min(n, min);
          max = Math.max(n, max);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  return [min, max];
}

export default async function (files: FileList) {
  if (files.length == 0 || !files[0]) return;

  // check if it contains a sequence and stack those frames
  const stacks = {};
  const stackedMedia: Media[] = [];

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

  // organize into stacks with metadata
  for (let name in stacks) {
    const stack = stacks[name];
    const frameRange = frameRangeOfSeq(stack.map((file) => file.name));
    const firstFrame = frameRange[0].toString();
    const lastFrame = frameRange[1].toString();

    const itemName = name.replace(
      stack.template,
      `[${firstFrame}..${lastFrame}]`
    );

    stackedMedia.push({
      name: itemName,
      template: name,
      frames: frameRange,
      framerate: 24,
      type: itemName.split(".").reverse()[0] || "",
      files: [...stack],
    });
  }

  await fs.add(stackedMedia);
  State.scope("media", { items: (await fs.list()).map((item) => item.name) });

  // organize files
  //  put sequences together into one item
  //  analyze files and read meta data

  const outputFile = await convertFiles(stackedMedia);

  if (outputFile) {
    await fs.add([
      { name: outputFile.name, type: "webm", files: [outputFile] },
    ]);

    State.scope("media", { items: (await fs.list()).map((item) => item.name) });
  } else {
    throw new Error("Conversion failed");
  }
}
