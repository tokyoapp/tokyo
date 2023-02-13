import { uuidv4 } from '../Math.js';

const PLACEHOLDER = new Image();
PLACEHOLDER.src = `data:image/png;base64,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`;

const defaults = {
    wrap_s: "REPEAT",
    wrap_t: "REPEAT",
    mag_filter: "LINEAR",
    min_filter: "LINEAR",
};

export class Texture {

    static get PLACEHOLDER() {
        return PLACEHOLDER;
    }

    get width() { 
        return this.image ? this.image.width : this.format.width;
    }

    get height() { 
        return this.image ? this.image.height : this.format.height;
    }

    get isTexture() {
        return true;
    }

    static get default() {
        return defaults;
    }

    constructor(image, format = { type: "RAW" }, flipY = true) {

        this.uid = uuidv4();

        this.type = "TEXTURE_2D";

        this.wrap_s = Texture.default.wrap_s;
        this.wrap_t = Texture.default.wrap_t;

        this.mag_filter = Texture.default.mag_filter;
        this.min_filter = Texture.default.min_filter;

        this.flipY = flipY;

        if(image instanceof ArrayBuffer) {
            this.format = format;
            this.data = image;
        } else {
            this.image = image;
        }
    }

}
