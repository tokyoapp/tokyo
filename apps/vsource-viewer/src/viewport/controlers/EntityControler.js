import { Entity } from "../scene/Entity.js";

export class EntityControler {

	static isMouseButton(e) {
		let mbutton;
		if (e.button != null) {
			if (e.buttons == 4) {
				mbutton = 2;
			} else {
				mbutton = e.buttons;
			}
		} else {
			mbutton = e.which;
		}
		return mbutton;
	}

	constructor(entity, viewport) {
		this.locked = false;

		if(entity) {
			this.entity = entity;

			if (entity instanceof Entity) {
				entity.addTrait({
					onUpdate: (entity, ms) => {
						this.update(ms);
					}
				});
			}
		}

		this.viewport = viewport;

		this.initKeyboard();
		this.initMouse();
	}

	update(ms) {

	}

	lock() { this.locked = true; }
	unlock() { this.locked = false; }

	initKeyboard() {
		this.keyMap = new Map();

		window.addEventListener('keydown', e => {
			if (document.pointerLockElement != null) {
				e.preventDefault();
				this.keyMap.set(e.key, true);
			}
		})

		window.addEventListener('keyup', e => {
			if (document.pointerLockElement != null) {
				e.preventDefault();
			}
			this.keyMap.delete(e.key);
		})
	}

	checkKey(key) {
		if (!this.locked) {
			return this.keyMap.has(key);
		}
		return false;
	}

	initMouse() {

	}

}