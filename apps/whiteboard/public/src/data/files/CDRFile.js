import { bitmapToURI } from '../../utils.js';
import { BinaryFile } from './BinaryFile.js';

// Corel Draw X6 file format
// https://github.com/photopea/CDR-specification

export default class CDRFile extends BinaryFile {

    static get fileEndings() {
        return ['.cdr'];
    }

    static read(file) {
        return new Promise(async (resolve, reject) => {
            const buffer = await file.arrayBuffer();
            resolve(await CDRFile.fromDataArray(buffer, file.name));
        })
    }

    static async fromDataArray(arrayBuffer, filename) {
        const cdr = new CDRFile();

        cdr.filename = filename;

        const getThumbnail = (entry) => {
            return new Promise(async (resolve, reject) => {
                const img = new Image();
    
                entry.getData(new zip.BlobWriter("image/bmp"), data => {
                    const url = URL.createObjectURL(data);
                    img.onload = () => {
                        resolve();
                    };
                    img.onerror = () => {
                        reject();
                    };
                    img.src = url;
                    img.setAttribute('tag', entry.filename);
                });

                cdr.thumbnail = img;
            })
        }

        return new Promise((resolve, reject) => {
            const blob = new Blob([ arrayBuffer ]);

            zip.createReader(new zip.BlobReader(blob), reader => {
                reader.getEntries(async entries => {
                    for(let entry of entries) {
                        switch(entry.filename) {
                            case 'metadata/thumbnails/thumbnail.bmp':
                                await getThumbnail(entry);
                                reader.close();
                                break;
                            case 'previews/thumbnail.png':
                                await getThumbnail(entry);
                                reader.close();
                                break;
                        }
                    }
                    resolve(cdr);
                });
            }, err => {
                reject(err);
            });
        })
    }

    async getImage() {
        return await bitmapToURI(this.thumbnail);
    }

}
