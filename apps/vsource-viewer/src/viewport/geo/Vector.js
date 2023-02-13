import DefaultMaterial from "../materials/DefaultMaterial.js";
import { Geometry } from "../scene/Geometry.js";

export class Vector extends Geometry {

	static vertecies(geo) {
		const vertexData = {
			vertecies: [],
			uvs: [],
			normals: [],
		};

		for (let p of geo.points) {
			const { x, y, z } = p;

			vertexData.vertecies.push([x, y, z]);
			vertexData.uvs.push([0, 0]);
			vertexData.normals.push([...geo.color]);
		}

		return vertexData;
	}

	onCreate(args) {
		args.guide = true;
		args.material = new DefaultMaterial();

		args.points = args.points || [];
		this.points = args.points;
		this.color = [1, 1, 1];
		this.name = "Vector";
	}

}
