import PDFFile from './PDFFile.js';

export default class AIFile extends PDFFile {

    static get fileEndings() {
        return ['.ai'];
    }


}
