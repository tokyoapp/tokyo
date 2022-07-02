export interface Ifs {
  add(files: any[]): void;
  files(): Promise<Array<[string, FileSystemFileHandle]>>;
  saveBuffer(buffer: ArrayBuffer): Promise<string>;
}
