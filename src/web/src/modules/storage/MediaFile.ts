import { isSuppotedMediaType, Media, MediaType } from "./Media";

export function getNameTemplate(name, template = "####") {
  return name.replace(/[0-9]+/, template);
}

function getName(fileName: string): string {
  const template = fileName.match(/[0-9]+/);
  let padding = 4;
  if (template) {
    padding = template.toString().length;
  }

  const frameTemplate = `%0${padding}d`;
  return getNameTemplate(fileName, frameTemplate);
}

function getSequence(
  files: File[]
): { name: string; frames: [number, number] } | undefined {
  const fileName = files[0]?.name;
  if (!fileName) return;

  const template = fileName.match(/[0-9]+/);
  let padding = 4;
  if (template) {
    padding = template.toString().length;
  }

  const frameTemplate = `%0${padding}d`;
  const nameTemplate = getNameTemplate(fileName, frameTemplate);

  const frameRange = frameRangeOfSeq(files.map((file) => file.name));
  const firstFrame = frameRange[0];
  const lastFrame = frameRange[1];

  return {
    name: nameTemplate.replace(
      frameTemplate,
      `[${firstFrame.toString()}..${lastFrame.toString()}]`
    ),
    frames: [firstFrame, lastFrame],
  };
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

export class MediaFile implements Media {
  name!: string;

  type!: MediaType;

  files: File[] = [];

  frames: number[] = [];

  framerate: number = 24;

  constructor(files: File[]) {
    const mainFile = files[0];
    const ext = mainFile?.name.split(".").reverse()[0];

    if (ext && isSuppotedMediaType(ext)) {
      this.files.push(...files);
      this.type = ext;

      if (files.length > 1) {
        const seq = getSequence(files);

        if (!seq) throw new Error("Sequence is corupt, " + mainFile?.name);

        this.name = seq.name;
        this.frames = seq.frames;
      } else {
        this.name = getName(mainFile.name);
        this.frames = [0];
      }
    } else {
      throw new Error("Unsopperted file type, " + mainFile?.name);
    }
  }
}
