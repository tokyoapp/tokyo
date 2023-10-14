import { createStore } from "solid-js/store";
import { render } from "solid-js/web";
import { createEffect, For, onCleanup } from "solid-js";

//? pushed changes from remote
//? new source joins the data pool

function createSource() {
  let reset = false;
  let id: undefined | string;

  function start(controller) {
    setInterval(() => {
      if (id) {
        // Part of list
        controller.enqueue({
          id: id,
          data: [
            {
              value: Math.random(),
            },
          ],
        });

        if (reset) {
          reset = false;
          // Invalidate old data
          controller.enqueue({ id: id, data: null });
        }
      }
    }, 250);

    setInterval(
      () => {
        controller.enqueue({ id: id, data: null });
      },
      Math.random() * 8000 + 4000,
    );
  }

  const read = new ReadableStream({
    start,
  });

  const write = new WritableStream({
    write(chunk) {
      id = chunk.id;
      reset = true;
    },
  });

  return [read, write] as const;
}

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

class Channel<P, T> {
  #writers = new Set<WritableStreamDefaultWriter<any>>();

  #subscriptions = new Set<(chunk: T) => void>();

  #requestHistory: Record<string, any>[] = [];

  connect() {
    const source_id = Math.floor(Math.random() * 100).toString();
    const [read, write] = createSource();

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

  constructor() {
    for (let x of [1]) {
      this.connect();
    }

    setTimeout(() => {
      this.connect();
    }, 4843);
  }

  async send(data: Record<string, string | number | undefined>) {
    this.#requestHistory.unshift(data);

    for (let writer of this.#writers) {
      if (writer) await writer.write(data);
    }
  }

  subscribe(cb: (msg: MessageEvent["data"]) => void) {
    this.#subscriptions.add(cb);
    return () => this.#subscriptions.delete(cb);
  }
}

function listAccessor(params: { id: string }) {
  createEffect(() => {
    if (params.id)
      request({
        id: params.id,
      });
  });

  const [list, setList] = createStore<{ value: number; source_id: string }[]>(
    [],
  );

  const channel = new Channel();

  let data: any[] = [];

  const currentSub = channel.subscribe((chunk) => {
    if (chunk.data === null) {
      data = data.filter((entry) => {
        return entry.source_id !== chunk.source_id;
      });
    } else {
      // there can be duplicate items in these chunks, should dedupe them here.
      data.push(
        ...chunk.data.map((d) => ({
          value: d.value,
          source_id: chunk.source_id,
        })),
      );
    }
    setList(data.sort((a, b) => a.value - b.value));
  });

  onCleanup(() => {
    currentSub();
  });

  const request = (params: { id: string | undefined }) => {
    channel.send({
      id: params.id,
    });
  };

  return {
    request,
    data: list,
  };
}

function Counter() {
  const [params, setParams] = createStore({
    id: "1",
  });

  setInterval(() => {
    setParams({
      id: Math.floor(Math.random() * 10000).toString(),
    });
  }, 8000);

  const d = listAccessor(params);

  // For comp doesnt rerender every child on item change
  return (
    <div>
      <For each={d.data}>
        {(v) => {
          return (
            <div>{v.source_id + " | " + (Date.now().valueOf() + v.value)}</div>
          );
        }}
      </For>
    </div>
  );
}

render(() => <Counter />, document.getElementById("app")!);
