import { Vec } from '../Math.js';
import Input from '../Input.js';

export default  {

    onCreate(entity) {
        entity.force = new Vec();
        entity.direction = new Vec();
        entity.speed = 0.01;
		entity.player = true;
		entity.jumppower = 0.33;

		entity.jumptimer = 0;

		entity.mode = 0;

		Input.init();
    },

    move(entity, dir) {
		entity.direction.z = dir;
	},

	pan(entity, dir) {
		entity.direction.y = -dir;
	},

	strafe(entity, dir) {
		entity.direction.x = dir;
    },

	jump(entity) {
		if(!entity.airborn && entity.jumptimer > 400) {
			entity.force.y = entity.jumppower;
			entity.airborn = true;
			entity.jumptimer = 0;
		}
    },

	boost(entity) {
		entity.force.y += 0.08;
		entity.force.y *= 0.75;

		entity.force.x *= 1.01;
		entity.force.z *= 1.01;
    },

    onUpdate(entity, ms) {
		entity.jumptimer += ms;

        if(!entity.player) return;

		if (Input.pressed("a", 14)) this.strafe(entity, -entity.speed);
		if (Input.pressed("d", 15)) this.strafe(entity, entity.speed);
		if (Input.pressed(" ", 0)) this.jump(entity);


        const camDirectionInv = [
			Math.sin(-entity.rotation.y),
			Math.max(Math.min(Math.tan(entity.rotation.x), 1), -1),
			Math.cos(-entity.rotation.y),
		]

		const camDirection = [
			Math.sin(entity.rotation.y),
			Math.max(Math.min(Math.tan(entity.rotation.x), 1), -1),
			Math.cos(entity.rotation.y),
		]

		if(entity.direction.x < 0) {
			entity.rotation.y = 180 * Math.PI / 180;
			entity.direction.x *= -1;
		} else if(entity.direction.x > 0) {
			entity.rotation.y = 0 * Math.PI / 180;
		}

		if(entity.airborn) {
			entity.direction.x *= 0.93;
	        entity.direction.z *= 0.93;
		}

		entity.force.x += (entity.direction.z * camDirectionInv[0]) + (entity.direction.x * camDirection[2]);
		entity.force.y += (entity.direction.z * camDirectionInv[1]) + entity.direction.y;
		entity.force.z += (entity.direction.z * camDirectionInv[2]) + (entity.direction.x * camDirection[0]);
		
		entity.force.y -= 0.01;

		if (Input.pressed("q", 3)) this.boost(entity);

		entity.velocity.x = entity.force.x;
		entity.velocity.y = entity.force.y;
		entity.velocity.z = entity.force.z;
		
        if(entity.colliderGeometry) {
			const collider = entity.colliderGeometry;
            if(collider.velocity) {
				entity.velocity.x = entity.force.x + collider.velocity.x;
            }
			entity.colliderGeometry = null;
		}

		entity.force.x *= 0.93;
		entity.force.z *= 0.93;

		entity.direction.x = 0;
		entity.direction.y = 0;
		entity.direction.z = 0;
    },

}
