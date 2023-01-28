interface ImageSource {
  // should always be a stream since it coule be streamed images from storage

  stop(): void;
}
