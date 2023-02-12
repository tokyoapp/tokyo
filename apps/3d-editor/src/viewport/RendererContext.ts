import { Shader } from "./RendererShader";

export class RendererContext {

	// canvas sizes
	get width() { return this.gl.canvas.width; }
	get height() { return this.gl.canvas.height; }
	get aspectratio() { return this.width / this.height; }

	onCreate() {
		// on create method
	}

	onDestory() {
		// on create method
	}

	enable(constant) {
		this.gl.enable(constant);
	}

	disable(constant) {
		this.gl.disable(constant);
	}

	constructor(canvas, contextOptions = {
		alpha: true,
		premultipliedAlpha: true,
		antialias: true,
		preserveDrawingBuffer: true, // possible if using a offscreen canvas
	}) {
		if (!canvas) throw "RendererContext: Err: no canvas";

		this.contextOptions = contextOptions;
		this.canvas = canvas;
		this.debug = false;
		this.currentShader = null;
		this.framebuffers = new Map();
		this.bufferTextures = new Map();
		this.shaders = new Map();

		this.options = {
			DEPTH_TEST: true,
			CULL_FACE: false,
			BLEND: true,
		}

		this.initialize();

		this.TEXTURE_MAG_FILTER = this.gl.LINEAR;
		this.TEXTURE_MIN_FILTER = this.gl.NEAREST_MIPMAP_LINEAR;

		this.MULTISAMPLING_SAMPLES = 6;
	}

	initialize() {
		this.getContext(this.canvas);
		this.onCreate();

		// enable gl options
		this.setOptions(this.options);
	}

	setOptions(options) {
		for (let opt in options) {
			if (options[opt] === true) {
				this.gl.enable(this.gl[opt]);
			} else if(options[opt] === false) {
				this.gl.disable(this.gl[opt]);
			}
		}
	}

	// set viewport resolution
	viewport(width, height) {
		this.gl.viewport(0, 0, width, height);
	}

	// set canvas and viewport resolution
	setResolution(width, height) {
		this.gl.canvas.width = width;
		this.gl.canvas.height = height;
	}

	// clear framebuffer
	clear() {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	}

	// get webgl context from canvas
	getContext(canvas) {
		this.canvas = canvas;

		const ctxtOpts = this.contextOptions;
		this.gl = canvas.getContext("webgl2", ctxtOpts) ||
				  canvas.getContext("webgl", ctxtOpts);

		this.gl.cullFace(this.gl.BACK);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
	}

	// use webgl shader
	useShader(shader) {
		if (!shader.initialized) {
			this.prepareShader(shader);
		}
		if(this.currentShader !== shader) {
			this.gl.useProgram(shader.program);
			this.currentShader = shader;
		}
	}

	setTexture(gltexture, type, slot, uniformStr) {
		this.gl.activeTexture(this.gl["TEXTURE" + slot]);
		this.gl.bindTexture(type, gltexture);

		if (uniformStr) {
			this.pushTexture(slot, uniformStr);
		}
	}

	pushTexture(textureUnitSlot, uniformStr) {
		this.gl.uniform1i(this.currentShader.uniforms[uniformStr], textureUnitSlot);
	}

	// use webgl texture
	useTextureBuffer(gltexture, type) {
		this.gl.bindTexture(type, gltexture);
	}

	// use framebuffer
	useFramebuffer(nameOrFBO) {
		const fbo = this.framebuffers.has(nameOrFBO) ? this.framebuffers.get(nameOrFBO) : nameOrFBO;
		fbo.use();
	}

	// unbind framebuffer
	clearFramebuffer() {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}

	// get framebuffer texture from cache
	getBufferTexture(name) {
		return this.bufferTextures.get(name);
	}

	// initialize webgl shader
	prepareShader(shader) {
		const gl = this.gl;

		if (shader instanceof Shader) {

			if (shader.source) {
				shader._vertShader = this.compileShader(shader.source[0], gl.VERTEX_SHADER);
				shader._fragShader = this.compileShader(shader.source[1], gl.FRAGMENT_SHADER);

				shader.program = this.createProgram(shader._vertShader, shader._fragShader);
				shader.gl = gl;

				shader._uniforms = this.getUniforms(shader.program);
				shader._attributes = this.getAttributes(shader.program);

				shader.initialized = true;

				let counter = 1;
				while (this.shaders.has(shader.constructor.name + counter)) {
					counter++;
				}
				this.shaders.set(shader.constructor.name + counter, shader);
			}

			return shader.program;
		}
	}

	// get attributes from shader program
	getAttributes(program) {
		const gl = this.gl;
		const attributes = {};

		const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
		for (let i = 0; i < numAttributes; ++i) {
			const name = gl.getActiveAttrib(program, i).name;
			attributes[name] = gl.getAttribLocation(program, name);
		}

		return attributes;
	}

	// get uniforms from shader program
	getUniforms(program) {
		const gl = this.gl;
		const uniforms = {};
		const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
		for (let i = 0; i < numUniforms; ++i) {
			const name = gl.getActiveUniform(program, i).name;
			uniforms[name] = gl.getUniformLocation(program, name);
		}
		return uniforms;
	}

	// compile glsl shader
	compileShader(src, type) {
		const gl = this.gl;
		const shader = gl.createShader(type);
		gl.shaderSource(shader, src);
		gl.compileShader(shader);

		if (this.debug) {
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				throw new Error(gl.getShaderInfoLog(shader));
			}
		}

		return shader;
	}

	// use vertex array object
	useVAO(VAO) {
		this.gl.bindVertexArray(VAO);
	}

	// create vertex array object for buffer
	createVAO(buffer) {
		const VAO = this.gl.createVertexArray();
		this.gl.bindVertexArray(VAO);

		this.initializeBuffersAndAttributes(buffer);

		return VAO;
	}

	// create webgl framebuffer objects
	createFramebuffer(name, width, height, depthAttatchment = true, colorAttatchment = true, antialiasing = true) {
		const gl = this.gl;

		let textures = {
			color: null,
			depth: null,
		}

		const framebuffers = {
            DRAW: gl.createFramebuffer(),
            OUTPUT: gl.createFramebuffer()
        };
		
		let colorRenderbuffer = null;
		let depthRenderbuffer = null;
			
		colorRenderbuffer = gl.createRenderbuffer();
		depthRenderbuffer = gl.createRenderbuffer();

		gl.bindRenderbuffer(gl.RENDERBUFFER, colorRenderbuffer);
		gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.MULTISAMPLING_SAMPLES, gl.RGBA8, width, height);

		gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer);
		gl.renderbufferStorageMultisample(gl.RENDERBUFFER, this.MULTISAMPLING_SAMPLES, gl.DEPTH_COMPONENT16, width, height);

		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.DRAW);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorRenderbuffer);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderbuffer);

		if(colorAttatchment) {
			// color
			const targetTexture = this.createBufferTexture(width, height);
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.OUTPUT);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);
			textures.color = targetTexture;
		}
		
		if(depthAttatchment) {
			// depth
			const depthTexture = this.createDepthTexture(width, height);
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.OUTPUT);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
			textures.depth = depthTexture;
		}

		if (name) {
			this.bufferTextures.set(name + '.depth', textures.depth);
			this.bufferTextures.set(name, textures.color);
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		const debug = this.debug;
		const debugLevel = this.debugLevel;

		const fbo = {
			framebuffers: framebuffers,
			textures: textures,

			use() {
				if(antialiasing) {
					gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.DRAW);
	
					if(debug && debugLevel > 1) {
						const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
				
						if(status === gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT) {
							console.error('FRAMEBUFFER_INCOMPLETE_ATTACHMENT');
						}
						if(status === gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT) {
							console.error('FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT');
						}
						if(status === gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS) {
							console.error('FRAMEBUFFER_INCOMPLETE_DIMENSIONS');
						}
						if(status === gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE) {
							console.error('FRAMEBUFFER_INCOMPLETE_MULTISAMPLE');
						}
						if(status !== gl.FRAMEBUFFER_COMPLETE) {
							console.error('FRAMEBUFFER_INCOMPLETE');
						}
					}
				} else {
					gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.OUTPUT);
				}
			},

			finalize() {
				if(antialiasing) {
					// blit into the output framebuffer
					gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffers.DRAW);
					gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffers.OUTPUT);
					
					if(colorAttatchment) {
						gl.blitFramebuffer(
							0, 0, width, height,
							0, 0, width, height,
							gl.COLOR_BUFFER_BIT, gl.LINEAR
						);
					}
					
					if(depthAttatchment) {
						gl.blitFramebuffer(
							0, 0, width, height,
							0, 0, width, height,
							gl.DEPTH_BUFFER_BIT, gl.NEAREST
						);
					}
				}
			}
		}
		
		this.framebuffers.set(name, fbo);

		return fbo;
	}

	// create shader program
	createProgram(vertShader, fragShader) {
		const gl = this.gl;
		const program = gl.createProgram();
		gl.attachShader(program, vertShader);
		gl.attachShader(program, fragShader);
		gl.linkProgram(program);

		if (this.debug) {
			if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
				throw new Error(gl.getProgramInfoLog(program));
			}
		}

		return program;
	}

	// create framebuffer depth texture
	createDepthTexture(w, h) {
		const gl = this.gl;

		const texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);

		gl.bindTexture(gl.TEXTURE_2D, null);

		return texture;
	}

	// create framebuffer texture
	createBufferTexture(w, h) {
		const gl = this.gl;

		const texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		gl.bindTexture(gl.TEXTURE_2D, null);

		return texture;
	}

	// update webgl texture
	updateTextureBuffer(texture, image) {
		const gl = this.gl;

		if (texture && image) {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
		} else {
			console.warn('tried to update emtpy texture');
		}
	}

	// create webgl texture
	createTexture(image, {
		mipmaps = true,
		TEXTURE_WRAP_S = "REPEAT",
		TEXTURE_WRAP_T = "REPEAT",
		TEXTURE_MAG_FILTER = "LINEAR",
		TEXTURE_MIN_FILTER = "LINEAR",
	} = {}) {
		const gl = this.gl;

		const texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.gl[TEXTURE_MAG_FILTER]);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.gl[TEXTURE_MIN_FILTER]);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.gl[TEXTURE_WRAP_S]);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.gl[TEXTURE_WRAP_T]);

		if (image) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
		} else {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
		}

		if (mipmaps || TEXTURE_MAG_FILTER.match('MIPMAP') || TEXTURE_MIN_FILTER.match('MIPMAP')) {
			gl.generateMipmap(gl.TEXTURE_2D);
		}

		return texture;
	}

	// create compressed webgl texture
	createCompressedTexture(texture) {
		const gl = this.gl;

		const ext = (
			gl.getExtension('WEBGL_compressed_texture_s3tc') ||
			gl.getExtension('MOZ_WEBGL_compressed_texture_s3tc') ||
			gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc')
		);

		const dataType = {
			'DXT1': ext.COMPRESSED_RGB_S3TC_DXT1_EXT,
			'DXT1_ONEBITALPHA': ext.COMPRESSED_RGBA_S3TC_DXT1_EXT,
			'DXT3': ext.COMPRESSED_RGBA_S3TC_DXT3_EXT,
			'DXT5': ext.COMPRESSED_RGBA_S3TC_DXT5_EXT,
		}
		
		const texBuffer = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texBuffer);

		const format = dataType[texture.format.type];

		if(format) {
			gl.compressedTexImage2D(gl.TEXTURE_2D, 0, format, 
				texture.width, texture.height, 0, new Uint8Array(texture.data)); 
		}
		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		return texBuffer;
	}

	// update geometry buffer with DYNAMIC_DRAW
	updateArrayBuffer(buffer, data) {
		const gl = this.gl;

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
	}

	// init buffer resources for instanced draw
	initializeInstanceBuffer(bufferInfo) {
		const gl = this.gl;

		bufferInfo.instanceBuffer = gl.createBuffer();

		const instanceVertexBuffer = bufferInfo.getInstanceBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.instanceBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, instanceVertexBuffer, gl.DYNAMIC_DRAW);

		gl.vertexAttribPointer(this.currentShader.attributes['aTransform'], 
			4, gl.FLOAT, false, 4 * instanceVertexBuffer.BYTES_PER_ELEMENT, 0);
			
		gl.vertexAttribDivisor(this.currentShader.attributes['aTransform'], 1);
		gl.enableVertexAttribArray(this.currentShader.attributes['aTransform']);
	}

	// prepare geometry buffers for draw
	initializeBuffersAndAttributes(bufferInfo) {
		const gl = this.gl;
		const attributes = this.currentShader.attributes;

		// exit if verts are meptyy
		if (bufferInfo.vertecies.length < 1) return;

		const newbuffer = !bufferInfo.indexBuffer || !bufferInfo.vertexBuffer;

		// create new buffers
		if (newbuffer) {
			bufferInfo.indexBuffer = gl.createBuffer();
			bufferInfo.vertexBuffer = gl.createBuffer();

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indecies, gl.STATIC_DRAW);

			gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, bufferInfo.vertecies, gl.STATIC_DRAW);

		} else {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indexBuffer);
			gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.vertexBuffer);
		}

		const bpe = bufferInfo.vertecies.BYTES_PER_ELEMENT;

		let lastAttrSize = 0;

		const bufferAttributes = bufferInfo.attributes;

		for (let i = 0; i < bufferInfo.attributes.length; i++) {
			gl.vertexAttribPointer(
				attributes[bufferAttributes[i].attribute],
				bufferAttributes[i].size,
				gl.FLOAT,
				false,
				bufferInfo.elements * bpe,
				lastAttrSize * bpe
			);
			gl.enableVertexAttribArray(attributes[bufferAttributes[i].attribute]);

			lastAttrSize += bufferAttributes[i].size;
		}
	}

	destroy() {
		this.onDestory();

		const gl = this.gl;

		for(let [_, fb] of this.framebuffers) {
			gl.deleteTexture(fb.textures.color);
			gl.deleteTexture(fb.textures.depth);

			gl.deleteFramebuffer(fb.framebuffers.DRAW);
			gl.deleteFramebuffer(fb.framebuffers.OUTPUT);
			
			gl.deleteRenderbuffer(fb.colorRenderbuffer);
		}

		for(let [_, shader] of this.shaders) {
			gl.deleteProgram(shader.program);
		}
	}

	readPixel(x, y) {
		const data = new Uint8Array(4);
		this.gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
		return data;
	}

	readPixelFromBuffer(nameFBO, x, y) {
		const fbo = this.framebuffers.has(nameFBO) ? this.framebuffers.get(nameFBO) : null;
		if(fbo) {
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo.framebuffers.OUTPUT);
			const data = this.readPixel(x, y);
			this.clearFramebuffer();
			return data;
		}
	}

}
