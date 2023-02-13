import { Guide } from "./Guide.js";
import PrimitivetMaterial from '../materials/PrimitiveMaterial.js';

export class Grid extends Guide {

	static generate(w = 1, s = 20, baseColor) {
		const dataArray = {
			vertecies: [],
			uvs: [],
			normals: [],
		};

		const size = w * (s / 2);
		for (let x = -s / 2; x <= s / 2; x++) {
			let color = baseColor;
			if (x == 0) color = [.4, .4, 1];

			dataArray.vertecies.push(
				[w * x, 0, size],
				[w * x, 0, -size]
			);

			dataArray.uvs.push(
				[0, 0],
				[0, 0]
			);

			dataArray.normals.push(
				color,
				color
			);
		}
		for (let z = -s / 2; z <= s / 2; z++) {
			let color = baseColor;
			if (z == 0) color = [1, .4, .4];

			dataArray.vertecies.push(
				[size, 0, w * z],
				[-size, 0, w * z]
			);

			dataArray.uvs.push(
				[0, 0],
				[0, 0]
			);

			dataArray.normals.push(
				color,
				color
			);
		}

		return dataArray;
	}

	static vertecies(geo) {
		return this.generate(geo.size, geo.count, geo.color);
	}

	onCreate(args) {
		this.guide = true;
		this.name = "Grid";
		this.selectable = false;
		this.color = [0.4, 0.4, 0.4];
		this.size = args.size;
		this.count = args.count;
		this.material = new PrimitivetMaterial();
	}
}
