class Subscriptions<T> extends TransformStream {
  constructor(arr: Set<(chunk: T) => void>) {
    super({
      start() {},
      transform(chunk, controller) {
        for (let cb of arr) {
          cb(chunk);
        }
        controller.enqueue(chunk);
      },
    });
  }
}

class MessageTransform<T> extends TransformStream {
  constructor(id: string) {
    super({
      start() {},
      transform(chunk, controller) {
        controller.enqueue({
          source_id: id,
          data: chunk.data,
        });
      },
    });
  }
}

export class Channel<P, T> {
  #writers = new Set<WritableStreamDefaultWriter<any>>();

  #subscriptions = new Set<(chunk: T) => void>();

  #requestHistory: Record<string, any>[] = [];

  connect(read: ReadableStream, write: WritableStream) {
    const source_id = Math.floor(Math.random() * 100000).toString();

    const writer = write.getWriter();
    this.#writers.add(writer);

    read
      .pipeThrough(new MessageTransform(source_id))
      .pipeThrough(new Subscriptions(this.#subscriptions))
      .pipeTo(new WritableStream());

    const lastReq = this.#requestHistory[0];
    if (lastReq) {
      writer.write(lastReq);
    }

    return source_id;
  }

  async send(data: Record<string, string | number | undefined | Array<string | number>>) {
    this.#requestHistory.unshift(data);

    for (const writer of this.#writers) {
      if (writer) await writer.write(data);
    }
  }

  subscribe(cb: (msg: MessageEvent['data']) => void) {
    this.#subscriptions.add(cb);
    return () => this.#subscriptions.delete(cb);
  }
}
