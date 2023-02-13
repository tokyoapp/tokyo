import { glMatrix, mat4, quat, vec3 } from "gl-matrix";
import { Transform, uuidv4 } from "../Math.js";

// performance option, use Array instad of Float32Arrays
glMatrix.setMatrixArrayType(Array);

export class Geometry extends Transform {

	static get attributes() {
		return [
			{ size: 3, attribute: "aPosition" },
			{ size: 2, attribute: "aTexCoords" },
			{ size: 3, attribute: "aNormal" },
		];
	}

	static vertecies(geo) {
		return {
			vertecies: [],
			uvs: [],
			normals: [],
		};
	}

	static indecies(geo) {
		return [];
	}

	constructor(args = {}) {
		super(args);

		this.name = "Geometry";

		this.instanced = false;
		this.removed = false;

		this.uid = uuidv4();

		this.matrixAutoUpdate = false;
		this.lastUpdate = 1;
		this.selectable = false;
		this.guide = false;
		this.hidden = false;
		this.scale = 1;
		this.parent = null;
		this.uv = [0, 0];

		this.onCreate(args);

		const {
			indecies = null,
			vertecies = null,
			uvs = null,
			normals = null,
			material = this.material,
			hidden = this.hidden,
			selectable = this.selectable,
			guide = this.guide,
			hitbox = this.hitbox,
			scale = this.scale,
			parent = this.parent,
			uv = this.uv,
		} = args;

		const verts = this.constructor.vertecies(this);
		const vertIndecies = this.constructor.indecies(this);

		this.parent = parent;
		this.hitbox = hitbox;
		this.material = material;
		this.indecies = indecies || vertIndecies;
		this.vertecies = vertecies || verts.vertecies;
		this.uvs = uvs || verts.uvs;
		this.normals = normals || verts.normals;
		this.hidden = hidden;
		this.selectable = selectable;
		this.guide = guide;
		this.uv = uv;
		this.scale = scale;
		this.modelMatrix = mat4.create();
	}

	updateModel() {
		this.updateModelMatrix();
		this.lastUpdate = Date.now();
	}

	getGlobalPosition() {
		return this.parent ? vec3.add([], this.position, this.parent.getGlobalPosition()) : this.position;
	}

	getGlobalRotation() {
		return this.parent ? vec3.add([], this.rotation, this.parent.getGlobalRotation()) : this.rotation;
	}
	
	getState() {
		return (
			this.parent ? this.parent.state : 0
		) + (
			this.position[0] +
			this.position[1] +
			this.position[2]
		) + (
			this.rotation[0] +
			this.rotation[1] +
			this.rotation[2]
		) + (
			this.origin[0] +
			this.origin[1] +
			this.origin[2]
		) + (
			this.scale
		) + this.lastUpdate;
	}

	updateVertexBuffer() {
		this.uid = Date.now() + Math.random();
	}

	updateModelMatrix() {
		const state = this.getState();

		if(state != this.state) {
			this.state = state;
		} else {
			return;
		}

		const rotQuat = quat.create();

		const position = this.getGlobalPosition();
		const rotation = this.getGlobalRotation();
		const scale = Array.isArray(this.scale) ? this.scale : [this.scale, this.scale, this.scale];

		quat.fromEuler(rotQuat, 
			rotation[0] * ( 180 / Math.PI ),
			rotation[1] * ( 180 / Math.PI ),
			rotation[2] * ( 180 / Math.PI ),
		);

		mat4.fromRotationTranslationScaleOrigin(
			this.modelMatrix,
			rotQuat,
			position,
			scale,
			this.origin
		);

		mat4.translate(this.modelMatrix, this.modelMatrix, this.origin);
	}

	onCreate(args) {

	}

	remove() {
		this.removed = true;
	}

	createBuffer() {
		return new VertexBuffer(
			this.vertecies.map((v, i) => {
				const uv = this.uvs[i] || [0, 0];
				const normal = this.normals[i] || [0, 0, 0];

				return [
					v[0],
					v[1],
					v[2],
	
					uv[0],
					uv[1],
	
					normal[0],
					normal[1],
					normal[2]
				];
			}).flat(),
			this.indecies,
			this.constructor.attributes
		);
	}
}

export class VertexBuffer {

	get vertsPerElement() {
		return this.vertecies.length / this.elements;
	}

	get elements() {
		return this.attributeElements;
	}

	constructor(vertArray, indexArray, attributes) {

		this.vertecies = new Float32Array(vertArray);
		this.indecies = new Uint16Array(indexArray);
		
		this.attributes = attributes;

		this.attributeElements = 0;

		for (let key in this.attributes) {
			this.attributeElements += this.attributes[key].size;
		}
	}

}
