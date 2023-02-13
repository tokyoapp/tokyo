export default  {

    onCreate: (entity) => {
        entity.airborn = true;
        entity.collider = true;
    },

    onIntersects: (entity, collider, direction) => {
        // hitbox array relative from object position
        // [0] = top; [1] = right; [2] = bottom; [3] = left;

        if(!entity.collider) return;

        const top = entity.hitbox[0] + entity.position.y;
        const right = entity.hitbox[1] + entity.position.x;
        const bottom = entity.hitbox[2] + entity.position.y;
        const left = entity.hitbox[3] + entity.position.x;

        const top2 = collider.hitbox[0] + collider.position.y;
        const right2 = collider.hitbox[1] + collider.position.x;
        const bottom2 = collider.hitbox[2] + collider.position.y;
        const left2 = collider.hitbox[3] + collider.position.x;

        const verticalAxis = ( right > left2 && right < right2 || left < right2 && left > left2 );
        const horizontalAxis = ( bottom < top2 && bottom > bottom2 || top > bottom2 && top < top2 );

        const bellow = top - (entity.velocity.y * 2) < bottom2;
        const above = bottom - (entity.velocity.y * 2) > top2;

        const weight = entity.weight || 10;

        if (direction == 1 && !(bellow || above)) {
            // right edge collides
            if (right > left2 && right < right2 && horizontalAxis) {
                entity.velocity.x = -entity.velocity.y / weight;
                entity.position.x = left2 - entity.hitbox[1];
                entity.airborn = false;
            }
        }

        if (direction == 3 && !(bellow || above)) {

            // left edge collides
            if (left < right2 && left > left2 && horizontalAxis) {
                entity.velocity.x = -entity.velocity.y / weight;
                entity.position.x = right2 - entity.hitbox[3];
                entity.airborn = false;
            }
        }

        if (direction == 0) {
            // top edge collides
            if (top > bottom2 && top < top2 && verticalAxis) {
                entity.velocity.y = -entity.velocity.y / weight;
                entity.position.y = bottom2 - entity.hitbox[0];
            }
        }

        if (direction == 2) {
            // bottom edge collides
            if (bottom < top2 && bottom > bottom2 && verticalAxis) {
                entity.velocity.y = -entity.velocity.y / weight;
                entity.position.y = top2 - entity.hitbox[2];
                entity.airborn = false;

                if(entity.force) {
                    entity.force.y = 0;
                }

                entity.colliderGeometry = collider;
            }
        }
    },

}