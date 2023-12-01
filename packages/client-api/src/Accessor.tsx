import { Channel } from './Channel.js';
import * as Comlink from 'comlink';

export type AccessorParams = {
  /**
   * The query parameters that will be used to fetch the data.
   */
  query: Record<string, number | string | undefined | string[] | number[] | Date>;

  [key: string]: any;
};

/**
 * This class is responsible for handling the communication with the GeoApi, caching that data and keeping the data up to date with the given parameters.
 */
export class Accessor<Params extends AccessorParams, Cache, Data> {
  public params?: Params;

  public error?: Error;

  /**
   * Indicates if the accessor is currently fetching or filtering data.
   */
  public pending = false;

  private _cacheKey: string[] = [];
  private _cache: (Cache | undefined)[] = [];

  /**
   * Set the params for this accessor. This will trigger a new request to the GeoApi when needed.
   */
  public setParams(params: Params) {
    const req = this._strategy.createRequest(params);

    if (Array.isArray(req)) {
      throw new Error('Multiple requests are not supported yet');
    }

    if (req) {
      const messageId = 0;
      const cacheKey = JSON.stringify(req);

      if (cacheKey !== this._cacheKey[messageId]) {
        this._cacheKey[messageId] = cacheKey;
        this._cache[messageId] = undefined;
        this.setPending(true);
        req._nonce = messageId;
        this._channel.send(req);
        this.dispatch('request', params);
      } else if (this._cache[messageId] && params !== this.params) {
        this.params = params;
        this.dispatch('data', this.processData());
        this.setPending(false);
      }
    }

    this.params = params;

    this.clearError();
  }

  /**
   * Returns the filtered data if available.
   */
  public processData() {
    if (this._strategy.filter) {
      return this._strategy.filter(this._cache, this.params);
    }
  }

  private target = new EventTarget();

  // public on(event: 'data', callback: (payload?: Data) => void): () => void;
  // public on(event: 'pending', callback: (payload?: undefined) => void): () => void;
  // public on(event: 'error', callback: (payload?: undefined) => void): () => void;
  public on(event: 'data' | 'pending' | 'error' | 'request', callback: (payload?: any) => void) {
    const listener = ((ev: CustomEvent) => callback(ev.detail)) as EventListener;

    this.target.addEventListener(event, listener);

    if ('WorkerGlobalScope' in globalThis) {
      return Comlink.proxy(() => {
        this.target.removeEventListener(event, listener);
      });
    }
    return () => {
      this.target.removeEventListener(event, listener);
    };
  }

  private dispatch(event: 'data', payload?: Data): void;
  private dispatch(event: 'request', payload?: Params): void;
  private dispatch(event: 'pending', payload?: undefined): void;
  private dispatch(event: 'error', payload?: undefined): void;
  private dispatch(event: string, payload?: undefined) {
    this.target.dispatchEvent(new CustomEvent(event, { detail: payload }));
  }

  private _channel: Channel<RequestMessage, ResponseMessage>;

  constructor(
    client: {
      toStream(): readonly [ReadableStream, WritableStream];
    },
    private _strategy: {
      /**
       * Create request message from params.
       */
      createRequest(params: Params): RequestMessage | RequestMessage[] | undefined;
      /**
       * Handle and transform data from request. Data returned by this method will be cached by params["query"] as key.
       */
      handleMessage(msg: ResponseMessage, params?: Params): Cache | undefined;
      /**
       * Filtered cached data before returning it to the user.
       */
      filter: (cache: (Cache | undefined)[], params?: Params) => Data;
    }
  ) {
    this._channel = new Channel<RequestMessage, ResponseMessage>();
    this._channel.connect(...client.toStream());
    this._channel.rx?.pipeTo(
      new WritableStream({
        write: (msg) => {
          this.onMessage(msg);
        },
      })
    );
  }

  /**
   * Handles responses from the api.
   */
  private onMessage(msg: ResponseMessage) {
    if (msg._type === MessageType.Error) {
      console.error('ohno an error, this should be handled!', msg.error);

      if (msg.error) {
        this.onError(msg.error);
      }
    } else {
      const res = this._strategy.handleMessage(msg, this.params);
      if (res) {
        const messageId = msg._nonce ? msg._nonce : 0;
        this._cache[messageId] = res;
      }

      this.dispatch('data', this.processData());
      this.setPending(false);

      return res;
    }

    return msg;
  }

  private clearError() {
    this.error = undefined;
  }

  private onError(err: Error) {
    this.error = err;
    this.dispatch('error');
    this.setPending(false);
  }

  private setPending(pending: boolean) {
    this.pending = pending;
    this.dispatch('pending');
  }
}
