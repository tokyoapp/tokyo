class AudioPlayer extends AudioWorkletProcessor {
  channels = [];

  get bufferCount() {
    return this.channels[0]?.length;
  }

  constructor() {
    super();

    this.port.onmessage = (msg) => {
      const data = msg.data;

      if (data) {
        for (let channel = 0; channel < data.length; channel++) {
          if (!this.channels[channel]) {
            this.channels[channel] = [];
          }

          this.channels[channel].push(data[channel]);
        }
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = [];

    for (let channel of this.channels) {
      input.push(channel.shift());
    }

    for (let output of outputs) {
      // for every connected output

      for (let channel = 0; channel < input.length; channel++) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];

        if (inputChannel) {
          for (let sample = 0; sample < inputChannel.length; sample++) {
            if (outputChannel) {
              outputChannel[sample] = inputChannel[sample];
            }
          }
        } else {
          // console.log("input too slow");
        }
      }
    }

    // drop pacakges if too slow
    while (this.bufferCount > 24) {
      for (let channel of this.channels) {
        channel.shift();
      }
    }

    return true;
  }
}

registerProcessor("player", AudioPlayer);
