export default {

    onCreate: (entity) => {
        
    },

    onUpdate: (entity, ms) => {
        if(entity.followed) {
            let deltaX = -entity.followed.position.x - entity.position.x;
            let deltaY = -entity.followed.position.y - entity.position.y;

            const deadZone = [4, 3];

            deltaX = Math.max(deltaX - deadZone[0], 0.0) || Math.min(deltaX + deadZone[0], 0.0);
            deltaY = Math.max(deltaY - deadZone[1], 0.0) || Math.min(deltaY + deadZone[1], 0.0);

            entity.velocity.x = deltaX;
            entity.velocity.y = deltaY;

            entity.velocity.x *= 0.05;
            entity.velocity.y *= 0.05;
        }
    },

    methods: {
        follow(entity) {
            this.followed = entity;
        }
    },

}
