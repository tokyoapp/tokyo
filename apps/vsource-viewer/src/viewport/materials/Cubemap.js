import { Texture } from "./Texture.js";

export class Cubemap extends Texture {

    constructor(image) {
        super(image);

        this.type = "TEXTURE_CUBE_MAP";
        this.width = 1920;
        this.height = 1920;
        this.image = [];
    }

}
