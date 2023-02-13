import MeshShader from './MeshShader.js';

export default class WaterShader extends MeshShader {

    get customUniforms() {
        return {
            time: performance.now(),
        }
    }

    static fragmentSource() {
        return MeshShader.shaderFragmentHeader`

        uniform SceneProjection scene;
        uniform Material material;

        uniform float time;
        
        uniform int currentMaterialIndex;
        
        uniform sampler2D shadowDepth;
        uniform mat4 shadowProjMat;
        uniform mat4 shadowViewMat;

        vec2 TextureCoords() {
            float scale = 0.2;

            if (currentMaterialIndex != materialIndex) {
                discard;
            }

            vec2 displace = texture(material.displacementMap, (vTexCoords.xy / scale) + (time / 5000.0)).rg;

            return (vTexCoords.xy / scale) + (displace.xy * 0.2) + (time / 12000.0);
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

        vec3 rgb2hsb( in vec3 c ){
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz),
                         vec4(c.gb, K.xy),
                         step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r),
                         vec4(c.r, p.yzx),
                         step(p.x, c.r));
            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
                        d / (q.x + e),
                        q.x);
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

            finalColor.rgb *= 0.75 + diffuse;
        }

        bool Shadows(out vec4 finalColor, vec3 normal, vec3 shadowColor, vec3 lightColor) {

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

            float bias = 0.00005;
            float illuminated = step(vertex_relative_to_light.z, shadowmap_distance + bias);
            float lightDist = vertex_relative_to_light.z;

            if(illuminated < 1.0 && lightDist > 0.01) {
                finalColor.rgb *= shadowColor;
            }

            return illuminated < 1.0 && lightDist > 0.01;
        }

        void main() {
            // albedo
            vec4 color = material.diffuseColor;
            vec4 texcolor = texture(material.texture, TextureCoords());

            color = (texcolor * texcolor.a) + color * (1.0 - texcolor.a);
            color = vec4(color.rgb, color.a + texcolor.a / 2.0);

            if(color.a < 1.0) {
                discard;
            }
            
            oFragColor = color;

            vec3 normal = vNormal;
            vec4 normalMap = texture(material.normalMap, TextureCoords());

            if(normalMap.a > 0.0) {
                normal = vNormal.xyz + normalize(vec4(normalMap.xyz, 0.0) * inverse(scene.model)).xyz;
            }

            float specular = getMappedValue(material.specularMap, vec4(material.attributes.x)).r;

            vec3 shadowColor = vec3(
                150.0 / 255.0, // r
                150.0 / 255.0, // g
                170.0 / 255.0  // b
            );

            vec3 lightColor = vec3(
                255.0 / 255.0, // r
                240.0 / 255.0, // g
                200.0 / 255.0  // b
            );

            bool inShadow = Shadows(oFragColor, normal, shadowColor, lightColor);

            if(!inShadow) {
                Shading(oFragColor, normal, shadowColor, lightColor);
                Specular(oFragColor, normal, lightColor * specular, specular);
            }

            oFragColor.a = material.attributes[3];
        }
        `;
    }

}