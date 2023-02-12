import { FlatRenderer, FlatShader } from '../../viewport/FlatRenderer';
import { stateObject } from './State';

stateObject.chromaKey = [0.0, 0.0, 0.0];
stateObject.chromaThreshold = 0.5;
stateObject.brightness = 0;
stateObject.whitebalance = 0;
stateObject.contrast = 1;
stateObject.saturation = 0;
stateObject.blacks = .5;
stateObject.whites = .5;

let renderer = null;
let canvas = null;

class ImageShader extends FlatShader {

    get customUniforms() {
        return {
            chromaKey: stateObject.chromaKey || [0, 1, 0],
            chromaThreshold: stateObject.chromaThreshold || 0.0,
            brightness: stateObject.brightness || 0,
            whitebalance: stateObject.whitebalance || 0,
            contrast: stateObject.contrast || 0,
            saturation: stateObject.saturation || 0,
            blacks: stateObject.blacks || .5,
            whites: stateObject.whites || .5,
        }
    }

    static fragmentSource() {
		return `#version 300 es

			precision mediump float;
			
            uniform sampler2D imageTexture;
            
			uniform vec3 chromaKey;
            uniform float chromaThreshold;
            uniform float whitebalance;
            uniform float brightness;
            uniform float contrast;
            uniform float saturation;
            uniform float blacks;
            uniform float whites;

			in vec2 texCoords;

            out vec4 oFragColor;

            float map(float value, float min1, float max1, float min2, float max2) {
                return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
            }

            float luminance(vec3 rgb) {
                // Algorithm from Chapter 10 of Graphics Shaders.
                const vec3 W = vec3(0.2125, 0.7154, 0.0721);
                return dot(rgb, W);
            }

            void main () {
				vec2 uv = vec2(
					texCoords.x,
					-texCoords.y
                );
                
                // color
                vec4 color = vec4(texture(imageTexture, uv));
                
                // chromaKey
                if(chromaKey.r + chromaKey.g + chromaKey.b > 0.0) {

                    bool fitR = color.r + chromaThreshold > chromaKey.r && color.r - chromaThreshold < chromaKey.r;
                    bool fitG = color.g + chromaThreshold > chromaKey.g && color.g - chromaThreshold < chromaKey.g;
                    bool fitB = color.b + chromaThreshold > chromaKey.b && color.b - chromaThreshold < chromaKey.b;

                    float diff = distance(chromaKey.rgb, color.rgb);

                    if(fitR && fitG && fitB) {
                        discard;
                    }
                }

                // whitebalance
                color.r *= whitebalance + 1.0;
                color.b /= whitebalance + 1.0;

                // contrast
                color.rgb = ((color.rgb - 0.5f) * max(contrast, 0.0)) + 0.5f;

                // brightness
                color.rgb += brightness;

                float gamma = 1.0;
                color.rgb = pow(color.rgb, vec3(1.0/gamma));

                // whites and blacks
                color.r = map(color.r, 0.0, 1.0, blacks - 0.5, whites + 0.5);
                color.g = map(color.g, 0.0, 1.0, blacks - 0.5, whites + 0.5);
                color.b = map(color.b, 0.0, 1.0, blacks - 0.5, whites + 0.5);

                // saturation
                const vec3 W = vec3(0.2125, 0.7154, 0.0721);
                color.rgb = mix(vec3(dot(color.rgb, W)), color.rgb, 1.0 + saturation);

                oFragColor = color;
            }
        `;
	}
}

let imageCache = null;

export function preprocess(img) {    
    if(!renderer || imageCache != img) {
        const width = stateObject.width;
        const height = stateObject.height;

        canvas = document.createElement('canvas');
    
        canvas.width = width;
        canvas.height = height;

        renderer = new FlatRenderer(canvas);
        renderer.setImage(img);
        renderer.setShader(new ImageShader());

        canvas.style.position = "fixed";
        canvas.style.zIndex = '10000000';
        canvas.style.margin = '60px';
        canvas.style.border = '2px solid black';
        canvas.style.width = '200px';
    
        imageCache = img;
    }
    
    renderer.draw();

    return canvas;
}
