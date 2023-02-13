import MeshShader from './MeshShader.js';

export default class IndexShader extends MeshShader {

    static fragmentSource() {
        return MeshShader.shaderFragmentHeader`
            void main() {
                oFragColor = vec4(index / 255.0, 0.0, 0.0, 1.0);
            }
        `;
    }

}