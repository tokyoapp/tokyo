import { Cube } from "./Cube.js";
import PrimitivetMaterial from '../materials/PrimitiveMaterial.js';
import { Geometry } from '../scene/Geometry.js';

export class Box extends Geometry {

	static vertecies(geo) {
		return {
			vertecies: [
				[geo.left, geo.top, geo.depth],
				[geo.right, geo.top, geo.depth],
				[geo.left, geo.bottom, geo.depth],
				[geo.right, geo.bottom, geo.depth],

				[geo.left, geo.top, -geo.depth],
				[geo.right, geo.top, -geo.depth],
				[geo.left, geo.bottom, -geo.depth],
				[geo.right, geo.bottom, -geo.depth],
			],
			uvs: [
				[0, 0],
				[1, 0],
				[0, 1],
				[1, 1],

				[0, 1],
				[1, 1],
				[1, 1],
				[0, 1],
			],
			normals: [
				[...geo.color],
				[...geo.color],
				[...geo.color],
				[...geo.color],

				[...geo.color],
				[...geo.color],
				[...geo.color],
				[...geo.color],
			],
		};
	}

	static indecies(geo) {
		return [
			// clipping off
			// fron
			0, 1, 2,
			1, 3, 2,
			// top
			0, 4, 5,
			0, 1, 5,
			// bottom
			2, 7, 6,
			2, 7, 3,
			// back
			4, 5, 6,
			5, 7, 6,
			// left
			0, 4, 6,
			0, 6, 2,
			// right
			1, 5, 7,
			1, 7, 3,
		]
	}

	constructor(args) {
		super(args);

		this.material.drawmode = "TRIANGLES";

		this.color = [1, 0, 0];

		this.matrixAutoUpdate = true;
	}

	get hitbox() {
		return [
			this.top,
			this.right,
			this.bottom,
			this.left,
			this.depth,
		]
	}

	onCreate(args) {
        super.onCreate(args);

		this.name = "Box";
		
		this.depth = args.depth || 1;
        this.top = args.top;
		this.right = args.right;
        this.bottom = args.bottom;
		this.left = args.left;

		args.material = args.material || new PrimitivetMaterial();
		args.hitbox = this.hitbox;
	}
}
