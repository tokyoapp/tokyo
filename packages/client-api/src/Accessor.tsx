import { createStore } from "solid-js/store";
import { render } from "solid-js/web";
import { createSignal, createEffect, For } from "solid-js";

//? pushed changes from remote
//? new source joins the data pool

function createSource() {
  let reset = false;
  let source_id = Math.floor(Math.random() * 100).toString();
  let id: undefined | string;

  function start(controller) {
    setInterval(() => {
      if (id) {
        // Part of list
        const chunk = [
          {
            id: id,
            source_id,
            value: Math.random(),
          },
        ];
        controller.enqueue(chunk);

        if (reset) {
          reset = false;
          // Invalidate old data
          controller.enqueue(null);
        }
      }
    }, 500);
  }

  const read = new ReadableStream({
    start,
  });

  const write = new WritableStream({
    write(chunk) {
      console.log("change request param", chunk);
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

class Channel<P, T> {
  #writers = new Set<WritableStreamDefaultWriter<any>>();

  #subscriptions = new Set<(chunk: T) => void>();

  #requestHistory: Record<string, any>[] = [];

  connect() {
    const [read, write] = createSource();
    // local.pipeTo(writable)
    // remote.pipeTo(writable)

    const writer = write.getWriter();
    this.#writers.add(writer);

    read
      .pipeThrough(new Subscriptions(this.#subscriptions))
      .pipeTo(new WritableStream());

    const lastReq = this.#requestHistory[0];
    if (lastReq) {
      writer.write(lastReq);
    }
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

  static accessor() {
    const [list, setList] = createStore<
      { value: number; id: string; source_id: string }[]
    >([]);

    const channel = new Channel();

    let data: any[] = [];

    const currentSub = channel.subscribe((chunk) => {
      if (!chunk) {
        data = [];
      } else {
        // there can be duplicate items in these chunks, should dedupe them here.
        data.push(...chunk);
      }
      setList(data.sort((a, b) => a.value - b.value));
    });

    return {
      request: (params: { id: string | undefined }) => {
        channel.send({
          id: params.id,
        });
      },
      destroy() {
        currentSub();
      },
      data: list,
    };
  }
}

function Counter(props: { id: string | undefined }) {
  const d = Channel.accessor();

  createEffect(() => {
    if (props.id)
      d.request({
        id: props.id,
      });
  });

  // For comp doesnt rerender every child on item change
  return (
    <div>
      <For each={d.data}>
        {(v) => {
          return (
            <div>
              {v.source_id +
                " | " +
                v.id +
                " - " +
                (Date.now().valueOf() + v.value)}
            </div>
          );
        }}
      </For>
    </div>
  );
}

render(() => {
  const [id, setId] = createSignal("1");

  setInterval(() => {
    setId(Math.floor(Math.random() * 10000).toString());
  }, 8000);

  return <Counter id={id()} />;
}, document.getElementById("app")!);
