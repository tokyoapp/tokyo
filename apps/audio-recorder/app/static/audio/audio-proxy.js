// audio-processor.js
class AudioProxy extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        // console.log(inputs);
        // const output = outputs[0]
        // output.forEach(channel => {
        //     for (let i = 0; i < channel.length; i++) {
        //         channel[i] = Math.random() * 2 - 1
        //     }
        // })

        this.port.postMessage(inputs);

        return true;
    }
}

registerProcessor('audio-proxy', AudioProxy);
