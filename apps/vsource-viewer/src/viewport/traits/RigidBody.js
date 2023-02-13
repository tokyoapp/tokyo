import { Vec } from '../Math.js';

export default  {

    onCreate: (entity) => {
        entity.weight = 3;
        entity.hover = false;
    },

    onUpdate: (entity, ms) => {
        let grav = -0.01;

        if(entity.hover) {
            grav = 0;
        }
        
        entity.velocity.x *= 0.98;
        entity.velocity.y += grav;
        entity.velocity.z *= 0.98;
    }

}