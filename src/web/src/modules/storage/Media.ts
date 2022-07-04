const media_types = ["png", "jpeg", "mp4", "mov", "webm", "webp"] as const;
type MediaTuple = typeof media_types;
export type MediaType = MediaTuple[number];

export function isSuppotedMediaType(type: string): type is MediaType {
  return media_types.includes(type as MediaType);
}

export interface Media {
  name: string; // custom item name
  type: MediaType;
  files: File[];
  frames?: number[]; // contains frame ranges eg. [1, 25]
  framerate?: number;
}
