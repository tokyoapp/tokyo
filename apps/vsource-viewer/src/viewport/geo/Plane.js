import { Geometry } from "../scene/Geometry.js";

export class Plane extends Geometry {

	static vertecies(geo) {
		const w = geo.width || 1;
		const h = geo.height || 1;

		return {
			vertecies: [
				[-w, -h, 0],
				[w, -h, 0],
				[w, h, 0],
				[w, h, 0],
				[-w, h, 0],
				[-w, -h, 0],
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
				[0, 0, 1],
				[0, 0, 1],
				[0, 0, 1],
				[0, 0, 1],
				[0, 0, 1],
				[0, 0, 1],
			],
		}
	}

	onCreate(args) {
		args.drawmoed = "TRIANGLES";

		this.name = "Plane";
		this.width = args.width;
		this.height = args.height;
	}
	
}
