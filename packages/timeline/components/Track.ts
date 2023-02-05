export class Clip {

    constructor(asset, start = 0, end = 0) {
        this.startTime = start;
        this.endTime = end;
        this.asset = asset ? asset.id : asset;
    }

}

export class Track {

    constructor(name) {
        this.clips = [];
        this.name = name;
    }

}
