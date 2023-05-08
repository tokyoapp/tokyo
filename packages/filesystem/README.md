# file-system-lib component for atrium

## TODO:
- download with file write handle if possible

## Doc

```typescript
interface FileRef {
    id: string,
    created: number,
    lastOpened: number,
    preview?: ImageBitmap,
    file: File,
}

interface LokalFilesystem {
    // open a os file chooser
    static async openFileChooser(): Promise<Array<File>>;
    // get image preview of file if available 
    static async getFilePreview(): Promise<ImageBitmap | null | undefined>;
    // get stored file information
    static async getFileById(): Promise<FileRef | undefined>;
    // open a stored file wiht readwrite
    static async openFileById(): Promise<File>;
    // get all stored files
    static async getFileList(): Promise<Array<FileRefPreview>>;
    // remote a stored file
    static async removeFileById(): void;
}
```
