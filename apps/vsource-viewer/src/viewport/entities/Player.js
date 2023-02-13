import DefaultMaterial from '../materials/DefaultMaterial.js';
import { Entity } from '../scene/Entity.js';
import Collider from '../traits/Collider.js';
import Playable from '../traits/Playable.js';

export default class Player extends Entity {

    constructor(args) {
        super(args);
        
        this.addTrait(Playable);
        this.addTrait(Collider);

        this.material = new DefaultMaterial();
    }

    onCreate(args) {
        args.hitbox = [1, 1, -1, -1, 1];
    }

}
