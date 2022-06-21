export interface Media {
  name: string; // parsed item name
  type: string; // usually file extension
  files: File[];
  frames?: number[]; // contains frame ranges eg. [1, 25]
  framerate?: number;
  template?: string; // tempalte string to mtach all files in sequence
}
