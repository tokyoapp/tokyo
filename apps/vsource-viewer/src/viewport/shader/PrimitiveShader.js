import MeshShader from './MeshShader.js';

export default class PrimitiveShader extends MeshShader {

    constructor() {
        super();

        this.drawmode = "LINES";
    }

    static fragmentSource() {
        return MeshShader.shaderFragmentHeader`
            uniform Material material;
            
            void main () {
                oFragColor = vec4(vec3(primitiveColor), material.attributes.a - (sqrt(vTexelPos.z) * 0.1));
            }
        `;
    }
}
