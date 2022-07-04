export interface Ifs {
  add(files: any[]): void;
  files(): Promise<Array<[string, FileSystemFileHandle]>>;
  readHeader(fileName: string): Promise<string | undefined>;
  saveBuffer(buffer: ArrayBuffer): Promise<string>;
}
