import AudioUtils from "./AudioUtils.js";

export default class AudioSource extends EventTarget {

    constructor(audioContext) {
        super();
        if(!audioContext)
            throw new Error('Missing audio context.');
            
        this.context = audioContext;
        this.gain = this.context.createGain();
        this.stream = null;
        this.currentSource = null;
        this.channels = [0, 1];
        this.deviceId = null;
    }

    setInputChannel(channel) {
        const channels = this.currentSource.channelCount;
    }

    connect(output) {
        this.gain.connect(output);
    }

    disconnect() {
        this.gain.disconnect();
    }

    setGain(val = 0) {
        this.gain.gain.setValueAtTime(val, this.context.currentTime + 0.01);
        this.dispatchEvent(new Event('change'));
    }

    getGain() {
        return this.gain.gain.value;
    }

    setInputStream(stream) {
        this.stream = stream;
        if(this.currentSource) {
            this.currentSource.disconnect();
        }
        this.currentSource = this.context.createMediaStreamSource(stream);
        this.currentSource.connect(this.gain);
        this.dispatchEvent(new Event('change'));
    }

    async getMedia() {
        return AudioUtils.getMicrophoneStream().then(stream => {
            this.setInputStream(stream);
        })
    }

    async setInputDevice(deviceId) {
        return AudioUtils.getDeviceStream(deviceId).then(stream => {
            this.deviceId = deviceId;
            this.setInputStream(stream);
        })
    }

}
