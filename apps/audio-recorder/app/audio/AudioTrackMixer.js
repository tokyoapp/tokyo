export class AudioTrackMixer {
  constructor(audioContext) {
    this.context = audioContext;
    this.tracks = new Set();

    this.destination = this.context.createMediaStreamDestination();
  }

  getTrack(index) {
    return [...this.tracks][index];
  }

  getTracks() {
    return [...this.tracks];
  }

  addTrack(track) {
    const outputNode = track.getOutputNode();
    outputNode.connect(this.destination);
    this.tracks.add(track);
  }

  removeTrack(track) {
    const outputNode = track.getOutputNode();
    outputNode.disconnect(this.destination);
    this.tracks.delete(track);
  }

  getOutputStream() {
    return this.destination.stream;
  }

  getOutputNode(audioContext) {
    const stream = this.getOutputStream();
    const outputNode = audioContext.createMediaStreamSource(stream);
    return outputNode;
  }
}
