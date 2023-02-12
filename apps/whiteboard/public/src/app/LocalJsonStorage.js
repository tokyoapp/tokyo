const listeners = new Map();

export class LocalJsonStorage {

    static get storage() {
        return "json-storage";
    }

    static list() {
        const item = localStorage.getItem(this.storage);
        const json = JSON.parse(item);
        return json || {};
    }

    static store(json) {
        const item = JSON.stringify(json);
        localStorage.setItem(this.storage, item);
    }

    static get(key) {
        if(!this.cache) {
            this.cache = this.list();
        }
        const store = this.cache;
        return store[key];
    }

    static set(key, value) {
        const store = this.list();
        store[key] = value;
        this.store(store);
        this.cache = null;
        this.emit(key);
    }

    static emit(key) {
        if(listeners.has(key)) {
            for(let call of listeners.get(key)) {
                call();
            }
        }
    }

    static listen(key, callback) {
        if(!listeners.has(key)) {
            listeners.set(key, []);
        }
        listeners.get(key).push(callback);
    }

    static default(key, value) {
        if(!this.get(key)) {
            this.set(key, value);
        }
        this.emit(key);
    }

}
