import MeshShader from './MeshShader.js';

export default class NormalShader extends MeshShader {

    static fragmentSource() {
        return MeshShader.shaderFragmentHeader`
            void main() {
                oFragColor = vec4(vec3(vNormal), 1.0);
            }
        `;
    }

}