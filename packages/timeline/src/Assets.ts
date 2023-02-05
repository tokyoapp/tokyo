import { StateManager } from "./StateManager";

const assets = new Map();

StateManager.onLoadState(state => {
    Asset.loadState(state.assets);
});

/*
 * Class for caching assets like images, videos, shaders etc.
 */
export class Asset {

    static loadState(state) {
        assets.clear();

        for (let asset of state) {
            Asset.add(new Asset(asset.name, asset.src, asset.type, asset.data));
        }
    }

    static list() {
        return assets;
    }

    static add(asset) {
        assets.set(asset.id, asset);
        StateManager.dispatch({ type: "assets", assets: [...assets].map(asset => asset[1]) });
    }

    static getById(id) {
        return assets.get(id);
    }

    constructor(name, src, type = "image", data) {
        this.data = data;
        this.id = name;
        this.name = name;
        this.type = type;
        this.src = src;
        this.loaded = false;

        // TODO: load from src if no data given?

        if (this.type == "image") {
            this.data = new Image();

            this.data.onload = () => {
                this.loaded = true;
                this.onload();
                this.onchange();
            };
            this.data.src = this.src;
        }

        if (this.type == "video") {
            this.video = document.createElement("video");
            
            const parts = this.src.split('/');
            const file = parts[parts.length-1];

            fetch('/clips/' + file).then(async res => {
                const buffer = await res.arrayBuffer();
                const blob = new Blob( [ buffer ] );

                this.data = blob;

                this.video.onloadedmetadata = () => {
                    this.loaded = true;
                    this.onload();
                    this.onchange();

                    this.video.onloadedmetadata = null;
                };

                this.video.src = URL.createObjectURL(this.data);
            })

        }
    }

    setSource(src) {
        this.src = src;
        this.onchange();
    }

    onload() {
        // data loaded
    }

    onchange() {
        // data changed
    }

    delete() {
        assets.delete(this.id);
        StateManager.dispatch({ type: "assets", assets: [...assets].map(asset => asset[1]) });
    }
}
