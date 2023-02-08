export default class DataFile {

    static fileEndings?: Array<string>;
    static fileType?: undefined | null | string;

    readData?: (fileData: Blob | ArrayBuffer) => any;
    read?: (file: File) => any;

}
