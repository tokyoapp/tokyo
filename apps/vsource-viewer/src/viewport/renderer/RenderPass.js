export class RenderPass {

	get buffer() {
		return this.renderer.getBufferTexture(this.id);
	}

	get depthbuffer() {
		return this.renderer.getBufferTexture(this.id + '.depth');
	}

	constructor(renderer, id, setup = {
		resolution: null,
		colorBuffer: true,
		depthbuffer: true,
		antialiasing: true,
	}) {
		this.id = id;
		this.sceneSetup = setup;
		this.shader = setup.shaderOverwrite;
		this.renderer = renderer;

		this.resolution = setup.resolution;

		this.width = this.resolution ? this.resolution[0] : renderer.width;
		this.height = this.resolution ? this.resolution[1] : renderer.height;

		this.fbo = this.renderer.createFramebuffer(this.id, this.width, this.height, setup.depthbuffer, setup.colorBuffer, setup.antialiasing);
	}

	resize(width, height) {
		if (!this.resolution) {
			this.width = width;
			this.height = height;

			const setup = this.sceneSetup;

			this.fbo = this.renderer.createFramebuffer(this.id, this.width, this.height, setup.depthbuffer, setup.colorBuffer, setup.antialiasing);
		}
	}

	use() {
		this.fbo.use();

		this.renderer.viewport(this.width, this.height);

		if (this.shader) {
			this.renderer.useShader(this.shader);
		}
	}

	finalize() {
		this.fbo.finalize();
	}
}
