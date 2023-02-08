import { LocalJsonStorage } from "./LocalJsonStorage.js";

export default class Preferences extends LocalJsonStorage {

    static get storage() {
        return "app-preferences";
    }

}
