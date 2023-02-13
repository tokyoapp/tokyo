import MeshShader from './MeshShader.js';

export default class MattShader extends MeshShader {

    static fragmentSource() {
        return MeshShader.shaderFragmentHeader`
            uniform Material material;

            void main() {
                // albedo
                vec4 color = material.diffuseColor;
                vec4 texcolor = texture(material.texture, vTexCoords.xy);

                color = (texcolor * texcolor.a) + color * (1.0 - texcolor.a);
                color = vec4(color.rgb, color.a + texcolor.a / 2.0);

                if(color.a < 1.0) {
                    discard;
                }

                oFragColor = color;
            }
        `;
    }

}