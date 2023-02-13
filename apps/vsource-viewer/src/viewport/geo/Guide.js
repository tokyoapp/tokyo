import PrimitivetMaterial from "../materials/PrimitiveMaterial.js";
import { Vec } from "../Math.js";
import { Geometry } from "../scene/Geometry.js";

export class Guide extends Geometry {

	static vertecies(geo) {
		const s = geo.scale * 10 || 10;
		const { x, y, z } = geo.origin || new Vec();

		return {
			vertecies: [
				[x, y, z + s],
				[x, y, z + -s],
				[x, y + s, z],
				[x, y - s, z],
				[x + s, y, z],
				[x - s, y, z],
			],
			uvs: [
				[0, 1],
				[0, 1],
				[0, 1],
				[0, 1],
				[0, 1],
				[0, 1],
			],
			normals: [
				[0, 0, 1],
				[0, 0, 1],
				[0, 1, 0],
				[0, 1, 0],
				[1, 0, 0],
				[1, 0, 0],
			],
		}
	}

	onCreate(args) {
		this.name = "Guide";
		args.guide = true;
		args.material = new PrimitivetMaterial();
	}

}
