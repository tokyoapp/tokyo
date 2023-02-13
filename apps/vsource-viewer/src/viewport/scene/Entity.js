import { Vec } from "../Math.js";
import { Geometry } from "./Geometry.js";

export class Entity extends Geometry {

    constructor(args = {}) {
        super(args);

        this.name = "Entity";
        this.matrixAutoUpdate = true;

        this.hitboxGeometry = null;

        this.weight = 0.99;
        this.velocity = new Vec();
        this.traits = new Set();

        this.intersections = new Set();

        if(args.traits) {
            for(let trait of args.traits) {
                this.addTrait(trait);
            }
        }
    }

    update(ms = 0) {
        for (let trait of this.traits) {
            if(trait.onUpdate) trait.onUpdate(this, ms);
        }

		this.position.x += this.velocity.x;
		this.position.y += this.velocity.y;
        this.position.z += this.velocity.z;

        this.intersections.clear();
    }

    intersects(collider, direction) {
        for (let trait of this.traits) {
            if(trait.onIntersects) trait.onIntersects(this, collider, direction);
        }
    }

    hasTrait(trait) {
        return this.traits.has(trait);
    }

    addTrait(trait) {
        this.traits.add(trait);

        if(trait.methods) {
            for(let key in trait.methods) {
                this[key] = trait.methods[key];
            }
        }
    }

    removeTrait(trait) {
        this.traits.delete(trait);
    }

    setPositionTo(transform) {
        this.position = transform.position;
        this.rotation = transform.rotation;
    }
}
