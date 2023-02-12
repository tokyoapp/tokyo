import { DataFile } from './DataFile.js';

export default class ImageFile extends DataFile {

    static get fileType() {
        return "image";
    }

    static read(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve(new this(reader.result));
            }
            reader.onerror = function() {
                reject();
            }
            reader.readAsDataURL(file);
        })
    }

    constructor(content) {
        super();
        this.content = content;
    }

    getImage() {
        return this.content.toString();
    }

}