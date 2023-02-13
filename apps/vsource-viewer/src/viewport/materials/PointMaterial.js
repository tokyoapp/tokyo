import { Material } from "./Material.js";
import PointShader from '../shader/PointShader.js';

export default class PointMaterial extends Material {

    constructor(args) {
        super(args);

        this.shader = PointShader;

        this.castShadows = false;
    }
}
