import { Shader } from '../renderer/RendererShader.js';

export default class MeshShader extends Shader {

    static get structMaterial() {
        return `
            struct Material {
                sampler2D texture;
                sampler2D specularMap;
                sampler2D normalMap;
                sampler2D displacementMap;
                sampler2D roughnessMap;
                vec4 diffuseColor;
                vec4 attributes;
            };
        `;
    }

    static get structSceneProjection() {
        return `
            struct SceneProjection {
                mat4 model;
                mat4 projectionView;
            };
        `;
    }

    static shaderVertexHeader(str = "") {
        return `#version 300 es
            
            precision mediump float;
            precision mediump int;
            
            layout(location = 0) in vec3 aPosition;
            layout(location = 1) in vec2 aTexCoords;
            layout(location = 2) in vec3 aNormal;

            layout(location = 3) in vec4 aTransform;

            ${MeshShader.structSceneProjection}
            ${MeshShader.structMaterial}
        
            out vec2 vTexCoords;
            out vec4 vWorldPos;
            out vec4 vTexelPos;
            out vec3 vViewPos;
            out vec3 vNormal;
            out vec3 vVertexPos;
            out vec3 primitiveColor;
            out float index;
            flat out int materialIndex;

            ${str}
        `;
    }

    static shaderFragmentHeader(strings, ...raw) {
        let string = "";

        for(let i = 0; i < strings.length; i++) {
            string += strings[i] || "";
            string += raw[i] || "";
        }

        return `#version 300 es

            precision mediump float;
            precision mediump int;

            in vec2 vTexCoords;
            in vec4 vTexelPos;
            in vec4 vWorldPos;
            in vec3 vViewPos;
            in vec3 vNormal;
            in vec3 vVertexPos;
            in vec3 primitiveColor;
            in float index;
            flat in int materialIndex;

            ${MeshShader.structSceneProjection}
            ${MeshShader.structMaterial}
        
            out vec4 oFragColor;

            ${string}
        `;
    }

    static vertexSource() {
        return MeshShader.shaderVertexHeader`
        
        uniform SceneProjection scene;

        uniform Material material;
        uniform float objectIndex;
        
        uniform vec3 viewPosition;
        
        void main() {
            float uniformSacle = 1.0;

            if(material.attributes.b > 0.0) {
                uniformSacle = (scene.projectionView * scene.model * vec4(aPosition, 1.0)).z;
            }

            vec4 pos = vec4(aPosition * uniformSacle, 1.0);

            // instanced scaleing
            if(aTransform.w > 0.0) {
                pos.xyz *= aTransform.w;
            }

            pos = scene.model * pos;

            // instanced translate
            pos.xyz += aTransform.xyz;
        
            gl_Position = scene.projectionView * pos;
            gl_PointSize = 2.0;

            // set vert outputs
            vTexCoords = vec2(aTexCoords.x, aTexCoords.y);
            vViewPos = viewPosition;
            vVertexPos = aPosition;
            vWorldPos = pos;
            vNormal = (transpose(inverse(scene.model)) * vec4(aNormal, 1.0)).xyz;
            primitiveColor = aNormal;
            index = objectIndex;
            vTexelPos = gl_Position;
        }`;
    }

    static fragmentSource() {
        return MeshShader.shaderFragmentHeader`

            uniform Material material;
            uniform int currentMaterialIndex;
            uniform bool textureFlipY;
            
            vec2 TextureCoords() {
                float scale = 1.0;

                vec2 texCoords = vTexCoords;

                if(textureFlipY) {
                    texCoords.y = -texCoords.y;
                }

                vec2 displace = texture(material.displacementMap, texCoords.xy).rg;

                return (texCoords.xy / scale) + displace.xy;
            }

            void main() {
                vec4 color = material.diffuseColor;
                vec4 texcolor = texture(material.texture, TextureCoords());

                color = (texcolor * texcolor.a) + color * (1.0 - texcolor.a);
                color = vec4(color.rgb, color.a + texcolor.a / 2.0);

                oFragColor = color;
            }
        `;
    }
}
