export interface Media {
  name: string; // parsed item name
  type: string; // usually file extension
  files: File[];
  frames?: number[]; // contains frame ranges eg. [1, 25]
  framerate?: number;
}
