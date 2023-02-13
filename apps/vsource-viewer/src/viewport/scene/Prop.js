const propRegistry = new Map();

export default class Prop {
    
    static get map() {
        return propRegistry;
    }
    
    static get(propType) {
        return propRegistry.get(propType);
    }
    
    static register(propType, type) {
        type.type = propType;
        return propRegistry.set(propType, type);
    }

    static list() {
        return [...propRegistry].map(([_, type]) => type);
    }

}
