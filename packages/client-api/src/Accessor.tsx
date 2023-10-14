import { createStore } from "solid-js/store";
import { render } from "solid-js/web";
import { createSignal, createEffect, For } from "solid-js";

//? pushed changes from remote
//? new source joins the data pool

function createSource() {
  let reset = false;
  let id: undefined | string;

  function start(controller) {
    let count = 0;
    setInterval(
      () => {
        if (id) {
          count++;
          // Part of list
          const chunk = [
            {
              id: id,
              value: Math.random(),
            },
          ];
          controller.enqueue(chunk);

          if (reset) {
            reset = false;
            // Invalidate old data
            controller.enqueue(null);
            count = 0;
          }
        }
      },
      (1000 / 135) * 32 * 2,
    );
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

const [list, setList] = createStore<{ value: number; id: string }[]>([]);

class Subscriptions<T> extends TransformStream {
  constructor(arr: Set<(chunk: T) => void>) {
    super({
      start() { },
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
  #write: WritableStreamDefaultWriter<any>;

  #subscriptions = new Set<(chunk: T) => void>();

  constructor() {
    const [read, write] = createSource();
    // local.pipeTo(writable)
    // remote.pipeTo(writable)

    const writer = write.getWriter();
    this.#write = writer;

    read
      .pipeThrough(new Subscriptions(this.#subscriptions))
      .pipeTo(new WritableStream());
  }

  request(params: P) { }

  async send(data: any) {
    if (this.#write) await this.#write.write(data);
  }

  subscribe(cb: (msg: MessageEvent["data"]) => void) {
    this.#subscriptions.add(cb);
    return () => this.#subscriptions.delete(cb);
  }

  static accessor() {
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
      request(params: { id: string }) {
        channel.send({
          id: params.id,
        });
      },
      list,
    };
  }
}

function Counter(props: { id: string }) {
  const d = Channel.accessor();

  createEffect(() => {
    d.request({
      id: props.id,
    });
  });

  // For comp doesnt rerender every child on item change
  return (
    <div>
      <For each={d.list}>
        {(v) => {
          return <div>{v.id + " - " + (Date.now().valueOf() + v.value)}</div>;
        }}
      </For>
    </div>
  );
}

render(() => {
  const [id, setId] = createSignal("123");

  setInterval(() => {
    setId(Math.floor(Math.random() * 10000).toString());
  }, 8000);

  return <Counter id={id()} />;
}, document.getElementById("app")!);

