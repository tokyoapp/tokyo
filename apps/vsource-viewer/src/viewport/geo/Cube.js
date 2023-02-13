import { Geometry } from "../scene/Geometry.js";

export class Cube extends Geometry {

	static vertecies(geo) {
		let vertecies = [];
		let uvs = [];
		let normals = [];

		const faces = geo.faces;

		let visibleFaces = [];

		for (let key in geo.visible) {
			if (geo.visible[key]) {
				visibleFaces.push(key);
			}
		}

		visibleFaces.forEach(face => {
			vertecies = vertecies.concat(faces[face].vertecies);
			uvs = uvs.concat(faces[face].uvs);
			normals = normals.concat(faces[face].normals);
		})

		return {
			vertecies,
			uvs,
			normals,
		};
	}

	static indecies(geo) {
		return [];
	}

	onCreate(args) {
		this.name = "Cube";
		this.vertsPerFace = 6;
		this.visible = {
			TOP: true,
			BOTTOM: true,
			LEFT: true,
			RIGHT: true,
			FRONT: true,
			BACK: true,
		}
	}

	get invisible() {
		return  !this.visible.TOP &&
				!this.visible.BOTTOM &&
				!this.visible.LEFT &&
				!this.visible.RIGHT &&
				!this.visible.FRONT &&
				!this.visible.BACK;
	}

	get faces() {
		const s = 1 / 2;
		const w = 1;
		const h = 1;

		const u = this.uv[0];
		const v = this.uv[1];

		const x = 0;
		const y = 0;
		const z = 0;

		return {
			TOP: {
				vertecies: [
					[s * w + x, s * w + y, s * h + z],
					[s * w + x, s * w + y, -s * h + z],
					[-s * w + x, s * w + y, -s * h + z],
					[s * w + x, s * w + y, s * h + z],
					[-s * w + x, s * w + y, -s * h + z],
					[-s * w + x, s * w + y, s * h + z],
				],
				uvs: [
					[1 + u, 1 + v],
					[1 + u, 0 + v],
					[0 + u, 0 + v],
					[1 + u, 1 + v],
					[0 + u, 0 + v],
					[0 + u, 1 + v],
				],
				normals: [
					[0, 1, 0],
					[0, 1, 0],
					[0, 1, 0],
					[0, 1, 0],
					[0, 1, 0],
					[0, 1, 0],
				],
			},
			BOTTOM: {
				vertecies: [
					[-s * w + x, -s * w + y, -s * h + z],
					[s * w + x, -s * w + y, -s * h + z],
					[s * w + x, -s * w + y, s * h + z],
					[-s * w + x, -s * w + y, s * h + z],
					[-s * w + x, -s * w + y, -s * h + z],
					[s * w + x, -s * w + y, s * h + z],
				],
				uvs: [
					[0 + u, 0 + v],
					[1 + u, 0 + v],
					[1 + u, 1 + v],
					[0 + u, 1 + v],
					[0 + u, 0 + v],
					[1 + u, 1 + v],
				],
				normals: [
					[0, -1, 0],
					[0, -1, 0],
					[0, -1, 0],
					[0, -1, 0],
					[0, -1, 0],
					[0, -1, 0],
				],
			},
			LEFT: {
				vertecies: [
					[-s * w + x, -s * h + y, s * w + z],
					[s * w + x, -s * h + y, s * w + z],
					[s * w + x, s * h + y, s * w + z],
					[-s * w + x, s * h + y, s * w + z],
					[-s * w + x, -s * h + y, s * w + z],
					[s * w + x, s * h + y, s * w + z],
				],
				uvs: [
					[0 + u, 0 + v],
					[1 + u, 0 + v],
					[1 + u, 1 + v],
					[0 + u, 1 + v],
					[0 + u, 0 + v],
					[1 + u, 1 + v],
				],
				normals: [
					[0, 0, 1],
					[0, 0, 1],
					[0, 0, 1],
					[0, 0, 1],
					[0, 0, 1],
					[0, 0, 1],
				],
			},
			RIGHT: {
				vertecies: [
					[s * w + x, s * h + y, -s * w + z],
					[s * w + x, -s * h + y, -s * w + z],
					[-s * w + x, -s * h + y, -s * w + z],
					[s * w + x, s * h + y, -s * w + z],
					[-s * w + x, -s * h + y, -s * w + z],
					[-s * w + x, s * h + y, -s * w + z],
				],
				uvs: [
					[1 + u, 1 + v],
					[1 + u, 0 + v],
					[0 + u, 0 + v],
					[1 + u, 1 + v],
					[0 + u, 0 + v],
					[0 + u, 1 + v],
				],
				normals: [
					[0, 0, -1],
					[0, 0, -1],
					[0, 0, -1],
					[0, 0, -1],
					[0, 0, -1],
					[0, 0, -1],
				],
			},
			FRONT: {
				vertecies: [
					[s * w + x, -s * w + y, -s * h + z],
					[s * w + x, s * w + y, -s * h + z],
					[s * w + x, s * w + y, s * h + z],
					[s * w + x, -s * w + y, s * h + z],
					[s * w + x, -s * w + y, -s * h + z],
					[s * w + x, s * w + y, s * h + z],
				],
				uvs: [
					[0 + u, 0 + v],
					[1 + u, 0 + v],
					[1 + u, 1 + v],
					[0 + u, 1 + v],
					[0 + u, 0 + v],
					[1 + u, 1 + v],
				],
				normals: [
					[1, 0, 0],
					[1, 0, 0],
					[1, 0, 0],
					[1, 0, 0],
					[1, 0, 0],
					[1, 0, 0],
				],
			},
			BACK: {
				vertecies: [
					[-s * w + x, s * w + y, s * h + z],
					[-s * w + x, s * w + y, -s * h + z],
					[-s * w + x, -s * w + y, -s * h + z],
					[-s * w + x, s * w + y, s * h + z],
					[-s * w + x, -s * w + y, -s * h + z],
					[-s * w + x, -s * w + y, s * h + z],
				],
				uvs: [
					[1 + u, 1 + v],
					[1 + u, 0 + v],
					[0 + u, 0 + v],
					[1 + u, 1 + v],
					[0 + u, 0 + v],
					[0 + u, 1 + v],
				],
				normals: [
					[-1, 0, 0],
					[-1, 0, 0],
					[-1, 0, 0],
					[-1, 0, 0],
					[-1, 0, 0],
					[-1, 0, 0],
				],
			}
		}
	}
}
