import MeshShader from './MeshShader.js';

export default class WorldShader extends MeshShader {

    static fragmentSource() {
        return MeshShader.shaderFragmentHeader`
            void main() {
                oFragColor = vec4(0.0, vTexCoords.x, vTexCoords.y, 1.0);
            }
        `;
    }

}