import { Entity } from './Entity';
import { Cube } from '../geo/Cube';

export class Pointlight extends Entity {

	static vertecies(geo) {
		return Cube.vertecies;
	}

	get isLight() {
		return true;
	}

}
