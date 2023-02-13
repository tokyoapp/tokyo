import { Material } from "./Material.js";
import PrimitiveShader from '../shader/PrimitiveShader.js';

export default class PrimitivetMaterial extends Material {

    constructor(args) {
        super(args);

        this.shader = PrimitiveShader;

        this.diffuseColor = [1, 1, 1, 1];

        this.castShadows = false;
    }
}
