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
        uniform sampler2D depth;
        uniform sampler2D guides;
        uniform sampler2D guidesDepth;
        uniform sampler2D normal;
        uniform sampler2D index;
        uniform sampler2D lighting;

        uniform vec4 selection;
        uniform vec2 resolution;
        uniform mat4 shadowProjMat;
        uniform mat4 shadowViewMat;

        uniform float fogMax;
        uniform float fogDensity;
        uniform float fogStartOffset;

        out vec4 oFragColor;

        vec2 rand( vec2 coord ) {
            vec2 noise;
            float nx = dot ( coord, vec2( 12.9898, 78.233 ) );
            float ny = dot ( coord, vec2( 12.9898, 78.233 ) * 2.0 );
            noise = clamp( fract ( 43758.5453 * sin( vec2( nx, ny ) ) ), 0.0, 1.0 );
            return ( noise * 2.0  - 1.0 ) * 0.0003;
        }

        vec4 rgb2hsb( in vec4 c ) {
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz),
                         vec4(c.gb, K.xy),
                         step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r),
                         vec4(c.r, p.yzx),
                         step(p.x, c.r));
            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec4(abs(q.z + (q.w - q.y) / (6.0 * d + e)),
                        d / (q.x + e),
                        q.x, 0.0);
        }

        vec4 blur1323(sampler2D image, vec2 uv) {
            vec2 direction = vec2(0.0, 1.0);
            vec4 color = vec4(0.0);
            vec2 off1 = vec2(1.411764705882353) * direction;
            vec2 off2 = vec2(3.2941176470588234) * direction;
            vec2 off3 = vec2(5.176470588235294) * direction;
            color += texture(image, uv) * 0.1964825501511404;
            color += texture(image, uv + (off1 / resolution)) * 0.2969069646728344;
            color += texture(image, uv - (off1 / resolution)) * 0.2969069646728344;
            color += texture(image, uv + (off2 / resolution)) * 0.09447039785044732;
            color += texture(image, uv - (off2 / resolution)) * 0.09447039785044732;
            color += texture(image, uv + (off3 / resolution)) * 0.010381362401148057;
            color += texture(image, uv - (off3 / resolution)) * 0.010381362401148057;
            return color;
        }

        vec4 blur132(sampler2D image, vec2 uv) {
            vec2 direction = vec2(0.0, 2.0);
            vec4 color = vec4(0.0);
            vec2 off1 = vec2(1.411764705882353) * direction;
            vec2 off2 = vec2(3.2941176470588234) * direction;
            vec2 off3 = vec2(5.176470588235294) * direction;
            color += blur1323(image, uv) * 0.1964825501511404;
            color += blur1323(image, uv + (off1 / resolution)) * 0.2969069646728344;
            color += blur1323(image, uv - (off1 / resolution)) * 0.2969069646728344;
            color += blur1323(image, uv + (off2 / resolution)) * 0.09447039785044732;
            color += blur1323(image, uv - (off2 / resolution)) * 0.09447039785044732;
            color += blur1323(image, uv + (off3 / resolution)) * 0.010381362401148057;
            color += blur1323(image, uv - (off3 / resolution)) * 0.010381362401148057;
            return color;
        }

        vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
            vec4 color = vec4(0.0);
            vec2 off1 = vec2(1.411764705882353) * direction;
            vec2 off2 = vec2(3.2941176470588234) * direction;
            vec2 off3 = vec2(5.176470588235294) * direction;
            color += blur132(image, uv) * 0.1964825501511404;
            color += blur132(image, uv + (off1 / resolution)) * 0.2969069646728344;
            color += blur132(image, uv - (off1 / resolution)) * 0.2969069646728344;
            color += blur132(image, uv + (off2 / resolution)) * 0.09447039785044732;
            color += blur132(image, uv - (off2 / resolution)) * 0.09447039785044732;
            color += blur132(image, uv + (off3 / resolution)) * 0.010381362401148057;
            color += blur132(image, uv - (off3 / resolution)) * 0.010381362401148057;
            return color;
        }

        const float gamma = 0.65;
        const float exposure = 2.2;

        void main() {
            vec4 normal = texture(normal, vTexCoords);
            vec4 guides = texture(guides, vTexCoords);
            vec4 guidesDepth = texture(guidesDepth, vTexCoords);
            vec4 depth = texture(depth, vTexCoords);

            oFragColor = texture(color, vTexCoords);

            vec4 bloom = blur13(lighting, vTexCoords, resolution, vec2(1.0, 0.0));
            bloom += blur13(lighting, vTexCoords, resolution, vec2(0.0, 1.0));

            // TODO: desatureate bloom
            oFragColor += bloom * 0.2;
            
            // color correction
            oFragColor.rgb = vec3(1.0) - exp(-oFragColor.rgb * exposure);
            oFragColor.rgb = pow(oFragColor.rgb, vec3(1.0 / gamma));

            float border = 0.25 / resolution.x;

            vec4 index0 = texture(index, vTexCoords);
            vec4 index1 = texture(index, vec2(vTexCoords.x + border, vTexCoords.y + border));
            vec4 index2 = texture(index, vec2(vTexCoords.x - border, vTexCoords.y + border));
            vec4 index3 = texture(index, vec2(vTexCoords.x - border, vTexCoords.y - border));
            vec4 index4 = texture(index, vec2(vTexCoords.x + border, vTexCoords.y - border));

            vec4 index5 = texture(index, vec2(vTexCoords.x + border, vTexCoords.y));
            vec4 index6 = texture(index, vec2(vTexCoords.x - border, vTexCoords.y));
            vec4 index7 = texture(index, vec2(vTexCoords.x, vTexCoords.y + border));
            vec4 index8 = texture(index, vec2(vTexCoords.x, vTexCoords.y - border));

            if(index0.r == selection.r && (
                index1.r != selection.r ||
                index2.r != selection.r ||
                index3.r != selection.r ||
                index4.r != selection.r ||
                index5.r != selection.r ||
                index6.r != selection.r ||
                index7.r != selection.r ||
                index8.r != selection.r
            )) {
                oFragColor.rgb = vec3(1.0, 1.0, 0.1);
            }

            // guides
            if(guides.a < 0.9 && guides.a > 0.0) {
                oFragColor.rgb = guides.rgb;

                // depth fog
                oFragColor.rgb -= min(pow(depth.r - fogStartOffset, fogDensity), fogMax);
            }
            if(guidesDepth.r > 0.0 && guidesDepth.r < depth.r) {
                oFragColor = vec4(guides.rgb, 1.0);

                oFragColor.a -= pow(guidesDepth.r - fogStartOffset, fogDensity) * 3.0;
            }
        }`;
    }

}