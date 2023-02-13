import MeshShader from './MeshShader.js';

export default class SpriteShader extends MeshShader {

    get customUniforms() {
        return {
            time: performance.now(),
        }
    }

    static fragmentSource() {
        return MeshShader.shaderFragmentHeader`
            uniform Material material;

            uniform int currentMaterialIndex;

            uniform float time;
            uniform float framerate;
            uniform float framecount;

            uniform bool textureFlipY;

            vec2 uv() {
                if (currentMaterialIndex != materialIndex) {
                    discard;
                }
                vec2 texCoords = vTexCoords;
                if(textureFlipY) {
                    texCoords.y = 1.0 - texCoords.y;
                }

                texCoords.x = vTexCoords.x / framecount;
                float frame = floor(mod(time / (1000.0 / framerate), framecount));
                texCoords.x += (1.0 / framecount) * frame;

                return texCoords.xy;
            }

            void main() {
                vec4 texcolor = texture(material.texture, uv().xy);

                if(texcolor.a < 0.1) {
                    discard;
                }

                oFragColor = texcolor;
            }
        `;
    }

}