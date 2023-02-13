import { EntityControler } from "./EntityControler.js";

let lastAnimationTick = 0;

export class ViewportController extends EntityControler {

	initMouse() {

		const entity = this.entity;

		this.sensivity = 0.0033;

		entity.position.x = 0;
		entity.position.y = -2;
		entity.position.z = 0;

		this.angleY = 0;
		this.angleX = 0.7;
		this.distance = -5;

		const down = e => {
			if (this.locked) return;

			if (e.buttons === 1) {
				this.rotating = true;
			} else if (e.buttons === 2) {
				this.moving = true;
			}
		}

		const up = e => {
			this.rotating = false;
			this.moving = false;
		}

		const wheel = e => {
			if (this.locked) return;
			this.distance -= 1 * Math.sign(e.deltaY);
			this.updateDistance();
		}

		const move = e => {
			if (this.rotating) {
				this.angleY += e.movementX * this.sensivity;
				this.angleX += e.movementY * this.sensivity;
			}
			if(this.moving) {
				entity.position.y -= (e.movementY * -this.distance * 0.3) * this.sensivity * 2;
				entity.position.x += (e.movementX * -this.distance * 0.3) * this.sensivity * Math.cos(entity.rotation.y) * 2;
				entity.position.z += (e.movementX * -this.distance * 0.3) * this.sensivity * Math.sin(entity.rotation.y) * 2;
			}
			if(this.moving || this.rotating) {
				this.update();
			}
		}

		this.viewport.canvas.addEventListener("wheel", wheel);
		this.viewport.canvas.addEventListener("contextmenu", e => e.preventDefault());
		this.viewport.canvas.addEventListener("mousedown", down);

		window.addEventListener("mousemove", move);
		window.addEventListener("mouseup", up);

		this.updateDistance();
		this.update();
	}

	updateDistance(ts = 0) {
		if(ts == 0) {
			ts = performance.now();
			lastAnimationTick = ts;
		}

		const targetDelta = -this.entity.origin.z + this.distance;
		const delta = (ts - lastAnimationTick) * 0.01;

		if(Math.sqrt(Math.pow(this.entity.origin.z - (this.entity.origin.z + targetDelta), 2)) > 0.2) {
			this.entity.origin.z += targetDelta * delta;
			
			lastAnimationTick = ts;
			requestAnimationFrame(this.updateDistance.bind(this));
		}
	}

	update(ms) {
		this.entity.rotation.y = this.angleY;
		this.entity.rotation.x = this.angleX;
	}

	reset() {
		this.angleY = 0;
		this.angleX = 0.7;
		this.update();

        this.distance = -5;
        this.updateDistance();

        this.entity.position.x = 0;
        this.entity.position.y = 0;
		this.entity.position.z = 0;
		this.entity.update();
	}

}
