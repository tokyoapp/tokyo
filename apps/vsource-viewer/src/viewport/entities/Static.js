import DefaultMaterial from '../materials/DefaultMaterial.js';
import { Entity } from '../scene/Entity.js';
import Collider from '../traits/Collider.js';

export default class Static extends Entity {

    constructor(args) {
        super(args);
        
        this.addTrait(Collider);

        this.material = new DefaultMaterial();
    }

    onCreate(args) {
        args.hitbox = [1, 1, -1, -1, 1];
    }

}
