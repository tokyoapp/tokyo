import { mat4, vec4, vec3, glMatrix } from "gl-matrix";

// performance option, use Array instad of Float32Arrays
glMatrix.setMatrixArrayType(Array);

export class Vec extends Array {

	toString() {
		return `${new Number(this[0]).toFixed(2)};${new Number(this[1]).toFixed(2)};${new Number(this[2]).toFixed(2)}`;
	}

	static avg(vec1, vec2) {
		return new Vec(
			(vec2[0] + vec1[0]) / 2,
			(vec2[1] + vec1[1]) / 2,
			(vec2[2] + vec1[2]) / 2,
		);
	}

	static normal(vec1) {
		const n1 = new Vec();
		vec3.normalize(n1, vec1);
		return n1;
	}

	static divide(vec1, vec2) {
		return new Vec(
			(vec1[0] / vec2[0]),
			(vec1[1] / vec2[1]),
			(vec1[2] / vec2[2]),
		);
	}

	static add(vec1, vec2) {
		return new Vec(
			vec1[0] + vec2[0],
			vec1[1] + vec2[1],
			vec1[2] + vec2[2],
			vec1[3] + vec2[3]
		);
	}

	static subtract(vec1, vec2) {
		return new Vec(
			vec1[0] - vec2[0],
			vec1[1] - vec2[1],
			vec1[2] - vec2[2],
			vec1[3] - vec2[3]
		);
	}

	static multiply(vec1, vec2) {
		return new Vec(
			vec1[0] * vec2[0],
			vec1[1] * vec2[1],
			vec1[2] * vec2[2],
			vec1[3] * vec2[3],
		);
	}

	get x() { return this[0]; }
	get y() { return this[1]; }
	get z() { return this[2]; }
	get w() { return this[3]; }

	set x(val) { this[0] = val; }
	set y(val) { this[1] = val; }
	set z(val) { this[2] = val; }
	set w(val) { this[3] = val; }

	constructor(x = 0, y = 0, z = 0, w = 0) {
		super();

		this[0] = x;
		this[1] = y;
		this[2] = z;
		this[3] = w;

		if (arguments.length === 1) {
			this[0] = x[0];
			this[1] = x[1];
			this[2] = x[2];
			this[3] = x[3];
		}
	}

	add(vec) {
		return Vec.add(this, vec);
	}

	multiply(vec) {
		return Vec.multiply(this, vec);
	}

	divide(vec) {
		return Vec.divide(this, vec);
	}

	subtract(vec) {
		return Vec.subtract(this, vec);
	}

	dot(vec) {
		return vec3.dot(this, vec);
	}

	normalize() {
		vec3.normalize(this, this);
		return this;
	}
}

export class Raycast extends Vec {

	constructor(camera, x, y) {
		super();

		const camPos = camera.position;
		const width = camera.sensor.width;
		const height = camera.sensor.height;

		this.origin = new Vec(-camPos.x, -camPos.y, -camPos.z);

		this[0] = (2 * x) / width - 1;
		this[1] = 1 - (2 * y) / height;
		this[2] = 1;
		this[3] = 1;

		this.project(camera.projMatrix, camera.viewMatrix);
	}

	project(projMatrix, viewMatrix) {

		const projInverse = mat4.create();
		mat4.invert(projInverse, projMatrix);
		vec4.transformMat4(this, this, projInverse);

		const viewInverse = mat4.create();
		mat4.invert(viewInverse, viewMatrix);
		vec4.transformMat4(this, this, viewInverse);

		vec4.normalize(this, this);
	}

	distnace(plane, normal) {
		const a = this.origin.add(plane).dot(normal);
		const b = this.dot(normal);
		return - (a / b);
	}

	hit(plane, normal) {
		const t = this.distnace(plane, normal);
		const pos = this.origin.add(this.multiply(new Vec(t, t, t)));

		return {
			distance: t,
			position: pos,
		};
	}
}

export class Transform {
	constructor({
		position = new Vec(),
		rotation = new Vec(),
		origin = new Vec(),
		scale = 1,
	} = {}) {
		this.position = new Vec(position);
		this.rotation = new Vec(rotation);
		this.scale = scale;
		this.origin = new Vec(origin);
	}
}

export function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}
