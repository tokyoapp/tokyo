import { Geometry } from "../scene/Geometry.js";
import { vec4 } from "gl-matrix";

export class Group extends Geometry {

	get vertecies() {
		const vertArray = [];
		const materials = new Set();
		
		for (let obj of this.objects) {
			const verts = obj.createBuffer().vertecies;
			
			materials.add(obj.material);
			const matIndex = [...materials].indexOf(obj.material);

			obj.updateModel();

			for(let vert = 0; vert < verts.length; vert += 9) {
				let vertex = vec4.create();

				vertex[0] = verts[vert + 0];
				vertex[1] = verts[vert + 1];
				vertex[2] = verts[vert + 2]; 
				vertex[3] = 1;

				vertex = vec4.transformMat4(vertex, vertex, obj.modelMatrix);
				
				vertArray.push(
					vertex[0],
					vertex[1],
					vertex[2],
	
					verts[vert + 3],
					verts[vert + 4],
					matIndex,
	
					verts[vert + 6],
					verts[vert + 7],
					verts[vert + 8],
				);
			}
		}

		this.materials = [...materials];

		return vertArray;
	}

	get indecies() {
		const indexArray = [];

		let offset = 0;

		for (let obj of this.objects) {
			const buffer = obj.createBuffer();
			indexArray.push(...buffer.indecies.map(i => i + offset));
			offset += buffer.vertecies.length / 9;
		}

		return indexArray;
	}

	onCreate(args) {
		args.objects = args.objects || [];
		this.objects = args.objects;
		this.name = "Group";
		this.materials = [];
	}

	add(...geo) {
		this.objects.push(...geo);
	}

}
