class MessageTransform<T> extends TransformStream {
  constructor(transform: (msg: T) => T) {
    super({
      start() {},
      transform(msg: T, controller) {
        controller.enqueue(transform(msg));
      },
    });
  }
}

/**
 * Handles communication and transformation of messages between the API and Application using streams.
 */
export class Channel<Send, Receive> {
  #writers = new Set<WritableStreamDefaultWriter>();

  #requestHistory: Send[] = [];

  #transforms: Set<(msg: Receive) => Receive | undefined> = new Set();

  transform(transform: (msg: Receive) => Receive | undefined) {
    this.#transforms.add(transform);
    return () => this.#transforms.delete(transform);
  }

  public rx?: ReadableStream<Receive>;

  connect(read: ReadableStream, write: WritableStream) {
    const writer = write.getWriter();
    this.#writers.add(writer);

    const rx = read.pipeThrough(
      new MessageTransform<Receive>((msg) => {
        for (const transform of this.#transforms) {
          msg = transform(msg);
        }
        return msg;
      })
    );
    this.rx = rx;

    const lastReq = this.#requestHistory[0];
    if (lastReq) {
      writer.write(lastReq);
    }
  }

  async send(data: Send) {
    this.#requestHistory.unshift(data);

    for (const writer of this.#writers) {
      if (writer) await writer.write(data);
    }
  }
}
