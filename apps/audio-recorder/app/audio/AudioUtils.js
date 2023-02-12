export default class AudioUtils {

    static async getAudioDevies() {
        const devices = {};
        return navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
            return navigator.mediaDevices.enumerateDevices().then(d => {
                for(let device of d) {
                    if(devices[device.kind] == undefined) {
                        devices[device.kind] = [];
                    }
                    if (device.deviceId != "default" && 
                        device.deviceId != "communications" ) {

                        devices[device.kind].push(device);
                    } else {
                        devices[device.kind][device.deviceId] = device;
                    }
                }
                return devices;
            }).catch(console.error);
        }).catch(console.error);    
    }

    static async getMicrophoneStream() {
        return navigator.mediaDevices.getUserMedia({
            audio: {
                sampleSize: 24,
                sampleRate: 48000,
                noiseSuppression: false,
                autoGainControl: false,
                echoCancellation: false
            }
        }).catch(err => {
            console.error('Error getting device stream.');
        });
    }

    static async getDeviceStream(deviceId) {
        console.log('Getting media:', deviceId);
        return navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: deviceId,
                sampleSize: 24,
                sampleRate: 48000,
                noiseSuppression: false,
                autoGainControl: false,
                echoCancellation: false
            }
        }).catch(err => {
            console.error('Error getting device stream.');
        });
    }

    static async getDesktopAudio() {
        return navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        }).then(stream => {
            const tracks = stream.getAudioTracks();
            console.log(tracks);
        });
    }

}
