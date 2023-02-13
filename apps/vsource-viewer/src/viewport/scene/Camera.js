import { glMatrix, mat4 } from "gl-matrix";
import PrimitivetMaterial from '../materials/PrimitiveMaterial.js';
import { Vec } from '../Math.js';
import { Entity } from './Entity.js';

// performance option, use Array instad of Float32Arrays
glMatrix.setMatrixArrayType(Array);

export class Camera extends Entity {
	
	static vertecies(geo) {
		const s = [1, 1 / geo.aspectRatio];
		const w = [geo.sensor.width, geo.sensor.height];
		// const w = 10;
		const depth = geo.perspective == Camera.ORTHGRAPHIC ? 0 : geo.farplane;
		
		return {
			vertecies: [
				[w[0], w[1], -depth],
				[-w[0], w[1], -depth],
				[-w[0], w[1], -depth],
				[-w[0], -w[1], -depth],
				[-w[0], -w[1], -depth],
				[w[0], -w[1], -depth],
				[w[0], -w[1], -depth],
				[w[0], w[1], -depth],

				[s[0], s[1], -geo.nearplane],
				[-s[0], s[1], -geo.nearplane],
				[-s[0], s[1], -geo.nearplane],
				[-s[0], -s[1], -geo.nearplane],
				[-s[0], -s[1], -geo.nearplane],
				[s[0], -s[1], -geo.nearplane],
				[s[0], -s[1], -geo.nearplane],
				[s[0], s[1], -geo.nearplane],
				[-s[0], -s[1], -geo.nearplane],
				[s[0], s[1], -geo.nearplane],

				[0, 0, -geo.nearplane],
				[0, 0, -geo.farplane],

				[-s[0], -s[1], -geo.nearplane],
				[-w[0], -w[1], -depth],
				[-s[0], s[1], -geo.nearplane],
				[-w[0], -w[1], -depth],
				[s[0], s[1], -geo.nearplane],
				[w[0], w[1], -depth],
				[s[0], -s[1], -geo.nearplane],
				[w[0], -w[1], -depth],
			],
			uvs: [
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[0, 0],
				[0, 0],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
				[1, 1],
			],
			normals: [
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 0, 0],
				[1, 0, 0],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
				[1, 1, 1],
			],
		}
	}

	static get ORTHGRAPHIC() {
		return "orthographic";
	}

	static get PERSPECTIVE() {
		return "perspective";
	}

	get aspectRatio() {
		return this.sensor.width / this.sensor.height;
	}

	onCreate(args) {

		this.sensor = {
			width: args.width,
			height: args.height
		}

		args.material = new PrimitivetMaterial();
	}

	constructor(args = {}) {
		const {
			fov = 90,
			farplane = 100,
			nearplane = 0.1,
			width = 1280,
			height = 720,
			perspective = Camera.PERSPECTIVE,
		} = args;
		super(args);

		this.hidden = true;
		this.guide = true;

		this.name = "Camera";

		this.fov = fov;
		this.farplane = farplane;
		this.nearplane = nearplane;
		this.lookAt = new Vec(0, 0, 0);
		this.perspective = perspective;

		this.projMatrix = mat4.create();
		this.viewMatrix = mat4.create();
		this.projViewMatrix = mat4.create();
	}

	updateModelMatrix() {

		const state = this.getState();

		if(state != this.state) {
			this.state = state;
		} else {
			return;
		}

		if (this.perspective == Camera.ORTHGRAPHIC) {
			mat4.ortho(
				this.projMatrix, 
				-this.sensor.width / 2, this.sensor.width / 2, 
				-this.sensor.height / 2, this.sensor.height / 2,
				this.nearplane, 
				this.farplane
			);
		}
		
		const position = this.getGlobalPosition();
		const rotation = this.getGlobalRotation();

		if (this.perspective == Camera.PERSPECTIVE) {
			mat4.perspective(this.projMatrix, 
				Math.PI / 180 * this.fov, 
				this.aspectRatio,
				this.nearplane, 
				this.farplane);
		}

		mat4.identity(this.viewMatrix);
		
		mat4.translate(this.viewMatrix, this.viewMatrix, this.origin);

		mat4.rotateX(this.viewMatrix, this.viewMatrix, this.rotation.x);
		mat4.rotateY(this.viewMatrix, this.viewMatrix, this.rotation.y);
		mat4.rotateZ(this.viewMatrix, this.viewMatrix, this.rotation.z);
		
		mat4.translate(this.viewMatrix, this.viewMatrix, position);

		mat4.identity(this.modelMatrix);
		mat4.invert(this.modelMatrix, this.viewMatrix);

		mat4.multiply(this.projViewMatrix, this.projMatrix, this.viewMatrix);
	}

}

Camera.type = 'camera';
