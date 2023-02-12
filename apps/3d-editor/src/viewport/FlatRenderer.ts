import { Texture } from './Texture';
import { Geometry } from './Geometry';
import { RendererContext } from './RendererContext';
import { Shader } from './RendererShader';

const TEXTURE = {
	EMPTY: 0,
	BACKGROUND: 1,
	PLACEHOLDER: 2,
}

export class FlatShader extends Shader {

	static vertexSource() {
		return `#version 300 es

			layout(location = 0) in vec3 aPosition;
			layout(location = 1) in vec2 aTexCoords;
			layout(location = 2) in vec3 aNormals;

			out vec2 texCoords;

			void main() {
				gl_Position = vec4(aPosition, 1.0);
				texCoords = aTexCoords;
			}
		`;
	}

	static fragmentSource() {
		return `#version 300 es

			precision mediump float;
			
			uniform sampler2D imageTexture;

			in vec2 texCoords;

			out vec4 oFragColor;

            void main () {
				vec2 uv = vec2(
					texCoords.x,
					-texCoords.y
				);

                oFragColor = vec4(texture(imageTexture, uv));
            }
        `;
	}
}

export class FlatRenderer extends RendererContext {

	onCreate() {
		this.clearPass = true;
		this.debug = true;

		this.textures = {};
		this.vertexBuffers = new Map();

		this.background = [0, 0, 0, 0];

		this.screen = new Geometry({
			vertecies: [
				[-1, -1, 0],
				[1, -1, 0],
				[1, 1, 0],
				[1, 1, 0],
				[-1, 1, 0],
				[-1, -1, 0],
			],
			uvs: [
				[0, 0],
				[1, 0],
				[1, 1],
				[1, 1],
				[0, 1],
				[0, 0],
			],
			normals: [
				[-1, -1, 0],
				[1, -1, 0],
				[1, 1, 0],
				[1, 1, 0],
				[-1, 1, 0],
				[-1, -1, 0],
			],
		});
		
		this.shader = new FlatShader();

		this.source = null;
	}

	clearBuffers() {
		this.vertexBuffers = new Map();
		this.textures = {};
	}

	setImage(image) {
		this.setResolution(image.width, image.height);
		this.source = new Texture(image);
	}

	setShader(shader) {
		this.shader = shader;
	}

	draw() {
		if(this.clearPass) {
			this.gl.clearColor(...this.background);
			this.clear();
		}

		this.useShader(this.shader);

		if(this.source) {
			this.setTexture(this.prepareTexture(this.source), this.gl.TEXTURE_2D, TEXTURE.BACKGROUND, 'imageTexture');
		}
		
		const custom = this.currentShader.customUniforms;
		if(custom) {
			this.currentShader.setUniforms(custom);
		}

		this.drawGeo(this.screen, this.currentShader.drawmode);
	}

	prepareTexture(texture) {
		if(!texture.uid) {
			throw new Error('Texture not valid');
		}

		if(!this.textures[texture.uid]) {
			let newTexture = null;

			if(texture.format) {
				newTexture = this.createCompressedTexture(texture);
			} else {
				newTexture = this.createTexture(texture.image, {
					TEXTURE_WRAP_S: texture.wrap_s,
					TEXTURE_WRAP_T: texture.wrap_t,
					TEXTURE_MAG_FILTER: texture.mag_filter,
					TEXTURE_MIN_FILTER: texture.min_filter,
				});
			}

			this.textures[texture.uid] = newTexture;
		}
		return this.textures[texture.uid];
	}

	getGemoetryBuffer(geo) {
		if(!this.vertexBuffers.has(geo.uid)) {
			this.vertexBuffers.set(geo.uid, geo.createBuffer());
		}
		return this.vertexBuffers.get(geo.uid);
	}

	drawGeo(geo, drawmode) {

		const buffer = this.getGemoetryBuffer(geo);

		if (!buffer.vao) {			
			buffer.vao = this.createVAO(buffer);
		}

		this.useVAO(buffer.vao);

		const gl = this.gl;

		if (buffer.indecies.length > 0) {
			gl.drawElements(gl[drawmode], buffer.indecies.length, gl.UNSIGNED_SHORT, 0);
		} else {
			gl.drawArrays(gl[drawmode], 0, buffer.vertecies.length / buffer.elements);
		}
	}

}
