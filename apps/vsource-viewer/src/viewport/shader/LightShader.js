import { Shader } from '../renderer/RendererShader.js';

export default class CompShader extends Shader {

    static vertexSource() {
        return `#version 300 es

        layout(location = 0) in vec3 aPosition;
        layout(location = 1) in vec2 aTexCoords;

        out vec2 vTexCoords;

        void main() {
            gl_Position = vec4(aPosition, 1.0);
            vTexCoords = aTexCoords;
        }`;
    }

    static fragmentSource() {
        return `#version 300 es

        precision mediump float;
        
        in vec2 vTexCoords;
        
        uniform sampler2D color;

        out vec4 oFragColor;

        float luma( vec4 rgb ) {
            return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b);
        }

        void main() {
            vec4 color = texture(color, vTexCoords);

            float bloomFactor = 5.0;

            oFragColor = max(color - 0.8, 0.0) * bloomFactor;
        }`;
    }

}