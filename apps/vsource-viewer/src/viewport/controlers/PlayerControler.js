import { Vec } from "../Math.js";
import { CameraControler } from "./CameraControler.js";

export class PlayerControler extends CameraControler {

	get entity() {
		return this.viewport.camera;
	}

	constructor(viewport) {
		super(null, viewport);

		this.sensivity = 0.00075;
		this.speed = 0.002;
		this.weight = 0.95;
		this.direction = new Vec();
	}

	move(dir) {
		this.direction.z = dir;
	}

	pan(dir) {
		this.direction.y = -dir;
	}

	strafe(dir) {
		this.direction.x = dir;
	}

	update() {
		const entity = this.entity;

		if (this.checkKey("w")) this.move(this.speed);
		if (this.checkKey("s")) this.move(-this.speed);

		if (this.checkKey("a")) this.strafe(this.speed);
		if (this.checkKey("d")) this.strafe(-this.speed);

		if (this.checkKey("q")) this.pan(this.speed);
		if (this.checkKey("y")) this.pan(-this.speed);

		const camDirectionInv = [
			Math.sin(-this.entity.rotation.y),
			Math.max(Math.min(Math.tan(this.entity.rotation.x), 1), -1),
			Math.cos(-this.entity.rotation.y),
		]

		const camDirection = [
			Math.sin(this.entity.rotation.y),
			Math.max(Math.min(Math.tan(this.entity.rotation.x), 1), -1),
			Math.cos(this.entity.rotation.y),
		]

		this.entity.velocity.x += (this.direction.z * camDirectionInv[0]) + (this.direction.x * camDirection[2]);
		this.entity.velocity.y += (this.direction.z * camDirectionInv[1]) + this.direction.y;
		this.entity.velocity.z += (this.direction.z * camDirectionInv[2]) + (this.direction.x * camDirection[0]);

		this.entity.position.x += this.entity.velocity.x;
		this.entity.position.y += this.entity.velocity.y;
		this.entity.position.z += this.entity.velocity.z;
		this.entity.position[3] = 1;

		let resistance = this.weight;

		this.entity.velocity.x *= resistance;
		this.entity.velocity.y *= resistance;
		this.entity.velocity.z *= resistance;

		this.direction.x = 0;
		this.direction.y = 0;
		this.direction.z = 0;
	}

}
