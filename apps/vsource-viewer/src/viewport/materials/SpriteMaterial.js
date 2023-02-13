import { Material } from "./Material.js";
import SpriteShader from '../shader/SpriteShader.js';

export default class SpriteMaterial extends Material {

    get customUniforms() {
        return this._customUniforms;
    }

    constructor(args) {
        super(args);

        this.framerate = 12;
        this.framecount = 8;
        
        this.shader = SpriteShader;
        this.castShadows = false;
        this.drawmode = "TRIANGLES";

        this._customUniforms = {
            framerate: this.framerate,
            framecount: this.framecount,
        }
    }

}
