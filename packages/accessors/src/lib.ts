import * as Comlink from "comlink";

/**
 * [ ] TODO: Handle compute errors
 * [ ] TODO: Clear cache entries that were not accessed for a while to save memory
 * [ ] TODO: Streaming data from multiple sources
 * [ ] TODO: Stream params to the accessor
 */

const CACHE_MAX_AGE = 1000 * 60 * 60; // 1h
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const CACHE = new Map<string, any>();
const CACHE_TIMESTAMPS = new Map<string, number>();

class MultiplexStream<T> extends WritableStream<T> {
  constructor(write: WritableStream) {
    super({
      write: async (msg) => {
        const writer = write.getWriter();
        writer.write(msg);
        writer.releaseLock();
      },
    });
  }
}

type AccessorState = {
  progress?: number;
  message?: string;
};

/**
 * Responsible for handling the communication with the API, caching that data and keeping the data up to date with the given parameters.
 */
export class Accessor<
  Query,
  Params,
  HandledMessage,
  Data,
  RequestMessage extends { nonce?: string },
  ResponseMessage extends { nonce?: string; type?: string; state?: AccessorState },
> {
  private _query?: Query;
  private _params?: Params;

  public state: AccessorState = {};

  public get query() {
    return this._query;
  }

  public get params() {
    return this._params;
  }

  private cacheKeys: string[] = [];

  /**
   * Set the query for this accessor. This will trigger a new request to the API for an invalid cache.
   */
  public set query(query: Query | undefined) {
    // shallow check, skip if queries are the same
    if (!query || query === this._query) return;

    const requests = this._strategy.createRequest(query);
    if (requests === undefined) return;

    this._query = query;

    const now = Date.now();

    let cached = true;

    for (const req of requests) {
      this.pending = true;

      // TODO: Streaming
      // - collect all responses for the same query

      // replicate the request to all peers
      for (const stream of this.streams) {
        const requestIndex = requests.indexOf(req);
        const sourceIndex = this.streams.indexOf(stream);

        const cacheKey = `${sourceIndex}.${requestIndex}.${JSON.stringify(requests)}`;
        // TODO: overwrites cache from other sources
        this.cacheKeys[requestIndex] = cacheKey;

        const timestamp = CACHE_TIMESTAMPS.get(cacheKey);
        const age = timestamp ? now - timestamp : now;

        if (CACHE.has(cacheKey) && age <= CACHE_MAX_AGE) {
          // skip request if cache is valid
          continue;
        }

        cached = false;

        CACHE.delete(cacheKey);
        CACHE_TIMESTAMPS.delete(cacheKey);

        req.nonce = cacheKey;

        const writer = stream.getWriter();
        writer.write(req);
        writer.releaseLock();
      }
    }

    if (cached) {
      this.compute();
    }
  }

  /**
   * Set the params for this accessor. This will only trigger a recompute, never a new request.
   */
  public set params(params: Params | undefined) {
    // shallow check, skip if params are the same
    if (!params || params === this._params) return;
    this._params = params;

    this.compute();
  }

  private _pending = false;

  private set pending(pending: boolean) {
    this._pending = pending;
    this.emit("pending");
  }

  public get pending() {
    return this._pending;
  }

  constructor(
    clients: {
      stream(): readonly [
        ReadableStream<ResponseMessage>,
        WritableStream<RequestMessage>,
      ];
    }[],
    public _strategy: {
      /**
       * Create request message from params.
       */
      createRequest(query: Query): RequestMessage[] | undefined;
      /**
       * Handle and transform data from request. Data returned by this method will be cached by params["query"] as key.
       */
      transform(msg: ResponseMessage): HandledMessage | undefined;
      /**
       * Filter / Transform / Aggregate cached data.
       */
      compute: (data: (HandledMessage | undefined)[], params: Params | undefined) => Data;
    },
  ) {
    for (const client of clients) {
      this.stream(client);
    }
  }

  /**
   * Returns the filtered data if available.
   */
  public compute() {
    const data: (HandledMessage | undefined)[] = [];

    for (const key of this.cacheKeys) {
      data.push(CACHE.get(key));
    }

    this.emit("data", this._strategy.compute(data, this.params));
    this.pending = false;
  }

  private receive = new WritableStream<ResponseMessage>({
    write: async (msg) => {
      if (msg.type === "state") {
        this.state = Object.assign(this.state, msg.state);
        this.emit("state", this.state);
        return;
      }

      const nonce = msg.nonce; // corresponds to the request message

      if (nonce && this.cacheKeys.includes(nonce)) {
        const data = await this._strategy.transform(msg);

        // TODO: if the data is partial, eg streamed, the cache will just be overwritten
        CACHE.set(nonce, data);
        CACHE_TIMESTAMPS.set(nonce, Date.now());

        this.compute();
      }
    },
  });

  private streams: WritableStream<RequestMessage>[] = [];

  private stream(client: {
    stream(): readonly [ReadableStream<ResponseMessage>, WritableStream<RequestMessage>];
  }) {
    const [read, write] = client.stream();
    this.streams.push(write);
    read.pipeTo(new MultiplexStream(this.receive));
  }

  public request(mutation: any) {
    this.pending = true;

    // replicate the request to all peers
    for (const stream of this.streams) {
      const writer = stream.getWriter();
      writer.write(mutation);
      writer.releaseLock();
    }

    // If a client connects after a request has been made, the request will run into the void.
    //  Not a concern here, since we connect in the constructor.
  }

  private target = new EventTarget();

  public on(event: "data", callback: (payload?: Data) => void): () => void;
  public on(event: "pending", callback: (payload?: undefined) => void): () => void;
  public on(event: "error", callback: (payload?: undefined) => void): () => void;
  public on(event: "state", callback: (payload?: AccessorState) => void): () => void;
  public on(event: string, callback: (payload?: undefined) => void) {
    const listener = ((ev: CustomEvent) => callback(ev.detail)) as EventListener;

    this.target.addEventListener(event, listener);

    if ("WorkerGlobalScope" in globalThis) {
      return Comlink.proxy(() => {
        this.target.removeEventListener(event, listener);
      });
    }
    return () => {
      this.target.removeEventListener(event, listener);
    };
  }

  private emit(event: "state", payload?: AccessorState): void;
  private emit(event: "data", payload?: Data): void;
  private emit(event: "pending", payload?: undefined): void;
  private emit(event: string, payload?: undefined) {
    this.target.dispatchEvent(new CustomEvent(event, { detail: payload }));
  }
}
