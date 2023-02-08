export default class Config {

    static get global() {
        return gloalconfig;
    }

    getValue(name, fallback) {
        if (!(name in this)) {
            this.define(name, fallback);
        }        
        return this[name].value;
    }

    hasValue(name) {
        return this[name];
    }

    setValue(name, value) {
        if (!this[name]) this.define(name, value);
        this[name].value = value;
    }

    define(name, defaultValue, value) {
        this[name] = new ConfigParameter(name, defaultValue, value);
    }

    constructor(name) {
        this.name = name;
    }

    save() {
        const save = localStorage.getItem(this.name);
        const data = JSON.parse(save) || {};
        for (let key in this) {
            const value = this[key].value;
            if (value != null) data[key] = value;
        }
        localStorage.setItem(this.name, JSON.stringify(data));
    }

    load() {
        const save = localStorage.getItem(this.name);
        const data = JSON.parse(save);
        for (let key in data) {
            if (key in this) {
                this[key].value = data[key];
            }
        }
        return this;
    }

}

class ConfigParameter {
    constructor(name, defaultValue, value) {
        this.name = name;
        this.default = defaultValue;
        this.value = value != null ? value : this.default;
    }
}

const gloalconfig = new Config('emote-editor-config');
