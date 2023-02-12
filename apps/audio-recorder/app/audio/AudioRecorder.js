import { AudioClip } from "./AudioClip.js";

function makeAudioBuffer(audioContext, chunks) {
    const numberOfChannels = chunks[0].length;
    const chunkSize = chunks[0][0].length;

    const buffer = audioContext.createBuffer(numberOfChannels, chunks.length * chunkSize, audioContext.sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelBuffer = buffer.getChannelData(channel);
        for(let chunk in chunks) {
            for(let i = 0; i < chunkSize; i++) {
                channelBuffer[i + (chunk * chunkSize)] = chunks[chunk][channel][i];
            }
        }
    }
    return buffer;
}

function getLiveBuffer(audioChunks) {
    const chunkBuffer = [[], []];

    for(let chunk of audioChunks) {
        const channel1 = chunk[0];
        const channel2 = chunk[1];

        for(let sample of channel1) {
            chunkBuffer[0].push(sample);
        }
        for(let sample of channel2) {
            chunkBuffer[1].push(sample);
        }
    }

    return chunkBuffer;
}

function drawAudioBuffer(buffer, duration, sampleRate) {
    return new AudioClip(buffer, duration, sampleRate);
}

export class AudioRecorder {

    constructor(audioContext) {
        this.context = audioContext;
        this.currentRecTime = 0;
        this.recording = false;
        this.audioProcessor = new AudioWorkletNode(this.context, 'audio-proxy');
        this.startRecordTs = 0;
        this.currClip = null;

        this.audioProcessor.port.onmessage = msg => {
            if (this.recording) {
                this.audioChunks.push(msg.data[0]);
                this.currentRecTime = (this.context.currentTime - this.startRecordTs);
            }
        }

        setInterval(() => {
            if(this.currClip) {
                const chunkBuffer = getLiveBuffer(this.audioChunks);
                this.currClip.update(chunkBuffer, this.currentRecTime);
            }
        }, 1000 / 30);
    }

    setInput(input) {
        this.input = input;
        this.input.connect(this.audioProcessor);
    }

    clearInput() {
        this.input.disconnect();
        this.input = null;
    }

    connect(output) {
        this.audioProcessor.connect(output);
    }

    disconnect() {
        this.audioProcessor.disconnect();
    }

    get audioChunks() {
        return this.currClip.data;
    }

    set audioChunks(val) {
        this.currClip.data = val;
    }

    startRecord() {
        this.currentRecTime = 0;
        this.startRecordTs = this.context.currentTime;
        this.recording = true;

        const chunkBuffer = getLiveBuffer([]);
        const clip = drawAudioBuffer(chunkBuffer, this.currentRecTime, this.context.sampleRate);
        this.currClip = clip;

        this.onClipCreated(clip);
    }

    onClipCreated(clip) {
        // callback
    }

    stopRecord() {
        this.recording = false;
        const chunkBuffer = getLiveBuffer(this.audioChunks);
        this.currClip.update(chunkBuffer, this.currentRecTime);
        this.currClip = null;
    }
    
}
