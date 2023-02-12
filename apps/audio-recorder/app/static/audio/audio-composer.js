// audio-processor.js

class AudioComposer extends AudioWorkletProcessor {

    constructor() {
        super();

        this.indexOffset = 0;

        const dropped = [];

        this.port.onmessage = msg => {
            const data = msg.data;
            this.bufferDataTime = Date.now();
            this.bufferData = data;
            this.indexOffset = 0;
        }
    }

    process(inputs, outputs, parameters) {

        if(this.bufferData) {
            const bufferDataAge = (Date.now() - this.bufferDataTime) / 1000;
            const bufferSize = 128;

            const timePerBuffer = bufferSize / sampleRate;
            const bufferCountInSecond = sampleRate / bufferSize;
            const timeSampleOffset = bufferDataAge * sampleRate;
            
            const output = outputs[0];
            output.forEach((channelData, channel) => {
                for (let i = 0; i < channelData.length; i++) {

                    const index = this.indexOffset + i;
                    const bufferIndex = Math.floor(index / bufferSize);
                    const sampleIndex = index - (bufferIndex * bufferSize);

                    const buffer = this.bufferData[bufferIndex];
                    if(buffer) {
                        channelData[i] = buffer[channel][sampleIndex];
                    }
                }

                this.indexOffset += channelData.length;
            })
        }
    
        return true;
    }
}

registerProcessor('audio-composer', AudioComposer);
