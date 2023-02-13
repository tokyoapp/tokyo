import { Material } from "./Material.js";
import WaterShader from '../shader/WaterShader.js';

export default class WaterMaterial extends Material {

    constructor(args) {
        super(args);

        this.shader = WaterShader;
        this.diffuseColor = [0.2, 0.5, 0.65, 1];

        this.specular = 0.8;
    }

}
