import MeshShader from './MeshShader.js';
import Config from '../Config.js';

Config.global.define('view_normal', false, false);
Config.global.define('view_uv', false, false);

export default class DefaultShader extends MeshShader {

    constructor() {
        super();

        this.customUniforms = {
            get normalView() {
                return Config.global.getValue('view_normal');
            },
            get uvView() {
                return Config.global.getValue('view_uv');
            }
        }
    }

    static fragmentSource() {
        return MeshShader.shaderFragmentHeader`

        uniform SceneProjection scene;
        uniform Material material;
        
        uniform sampler2D shadowDepth;
        uniform mat4 shadowProjMat;
        uniform mat4 shadowViewMat;
        uniform bool shadowMap;

        uniform bool normalView;
        uniform bool uvView;

        uniform vec3 lightColor;
        uniform bool textureFlipY;
            
        vec2 TextureCoords() {
            float scale = 1.0;

            vec2 texCoords = vTexCoords;

            if(textureFlipY) {
                texCoords.y = 1.0 - texCoords.y;
            }

            vec2 displace = texture(material.displacementMap, texCoords.xy).rg;

            return (texCoords.xy / scale) + displace.xy;
        }

        vec4 getMappedValue(sampler2D image, vec4 value) {
            vec4 mapped = texture(image, TextureCoords());
            if(mapped.a > 0.0) {
                value *= vec4(mapped.rgb, 1.0);
            }
            return value;
        }
        
        void Specular(out vec4 finalColor, vec3 normal, vec3 strength, float roughness) {

            vec3 viewDir = normalize(vViewPos - vWorldPos.xyz);

            vec3 norm = normalize(normal);
            vec3 lightPos = vec3(inverse(shadowViewMat)[2]);
            vec3 lightDir = normalize(lightPos.xyz);

            vec3 reflectDir = reflect(-lightDir, norm);

            float specular = pow(max(dot(viewDir, reflectDir), 0.0), 16.0 / roughness);

            finalColor.rgb += specular * strength;
        }

        float saturate(float value) {
            return clamp(value, 0.0, 1.0);
        }

        void Fresnel(out vec4 finalColor, vec3 normal) {
            vec3 viewDir = normalize(vViewPos - vWorldPos.xyz);
            float fresnel = dot(normal, viewDir);
            fresnel = saturate(1.0 - fresnel);
            fresnel = pow(fresnel, 75.0);
            finalColor += vec4(vec3(1., .0, .0) * fresnel, 0.0);
        }

        void Shading(out vec4 finalColor, vec3 normal, vec3 shadowColor, vec3 lightColor) {
            vec3 norm = normalize(normal);

            vec3 lightPos = vec3(inverse(shadowViewMat)[2]);
            vec3 lightDir = normalize(lightPos.xyz);
            float diffuse = max(dot(norm, lightDir), 0.0);

            finalColor.rgb *= 0.8 + (diffuse * lightColor);
        }

        bool Shadows() {

            vec4 pos = vWorldPos;

            vec4 v_Vertex_relative_to_light = shadowProjMat * shadowViewMat * pos;
            vec3 light_pos = v_Vertex_relative_to_light.xyz / v_Vertex_relative_to_light.w;

            vec3 vertex_relative_to_light = light_pos * 0.5 + 0.5;

            vec2 shadowTexCoord = vec2(
                clamp(vertex_relative_to_light.x, 0.0, 1.0),
                clamp(vertex_relative_to_light.y, 0.0, 1.0)
            );
            
            vec4 shadowmap_color1 = texture(shadowDepth, vec2(shadowTexCoord.x, shadowTexCoord.y));
            float shadowmap_distance = shadowmap_color1.r;

            float bias = 0.0001;
            float illuminated = step(vertex_relative_to_light.z, shadowmap_distance + bias);
            float lightDist = vertex_relative_to_light.z;

            return illuminated < 1.0 && lightDist > 0.01;
        }

        void main() {
            // albedo
            vec4 color = material.diffuseColor;
            vec4 texcolor = texture(material.texture, TextureCoords());

            color = (texcolor * texcolor.a) + color * (1.0 - texcolor.a);
            color = vec4(color.rgb, color.a + texcolor.a / 2.0);

            if(color.a < 0.5) {
                discard;
            }
            
            oFragColor = color;

            vec3 normal = vNormal;
            vec4 normalMap = texture(material.normalMap, TextureCoords());

            if(normalMap.a > 0.0) {
                normal = vNormal.xyz + normalize(vec4(normalMap.xyz, 0.0) * inverse(scene.model)).xyz;
            }

            float specular = getMappedValue(material.specularMap, vec4(material.attributes.x)).r;
            float roughness = getMappedValue(material.roughnessMap, vec4(material.attributes.y)).r;

            vec3 shadowColor = vec3(
                150.0 / 255.0, // r
                150.0 / 255.0, // g
                175.0 / 255.0  // b
            );

            bool inShadow = Shadows();

            Shading(oFragColor, normal, shadowColor, lightColor);

            if(!inShadow && shadowMap || !shadowMap) {
                Specular(oFragColor, normal, lightColor * specular, roughness);
            } else {
                oFragColor.rgb *= shadowColor;
            }

            if(normalView) {
                oFragColor = vec4(normal, 1.0);
            }

            if(uvView) {
                oFragColor = vec4(TextureCoords(), 0.0, 1.0);
            }
        }
        `;
    }

}
