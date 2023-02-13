import MeshShader from './MeshShader.js';

export default class PointShader extends MeshShader {

    constructor() {
        super();

        this.drawmode = "POINTS";
    }

    static fragmentSource() {
        return MeshShader.shaderFragmentHeader`
            void main () {
                oFragColor = vec4(1.0);
            }
        `;
    }
}
