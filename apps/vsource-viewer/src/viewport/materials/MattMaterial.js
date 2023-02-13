import { Material } from "./Material.js";
import MattShader from '../shader/MattShader.js';

export default class MattMaterial extends Material {

    constructor(args) {
        super(args);
        
        this.shader = MattShader;
        this.castShadows = false;
        this.drawmode = "TRIANGLES";
    }

}
