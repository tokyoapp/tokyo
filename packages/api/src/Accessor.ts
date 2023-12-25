import * as Comlink from 'comlink';
import { MessageType, RequestMessage } from './lib.js'; // should not be here, accessors should be unaware of the data passed in the,

export type AccessorParams = {
	/**
	 * The query parameters that will be used to fetch the data.
	 */
	query: Record<string, number | string | undefined | string[] | number[] | Date>;

	[key: string]: any;
};

/**
 * This class is responsible for handling the communication with the API, caching that data and keeping the data up to date with the given parameters.
 */
export class Accessor<Params extends AccessorParams, Cache, Data, ResponseMessage> {
	public params?: Params;

	public error?: Error;

	/**
	 * Indicates if the accessor is currently fetching or filtering data.
	 */
	public pending = false;

	private _cacheKey: string[] = [];
	private _cache: (Cache | undefined)[] = [];

	/**
	 * Set the params for this accessor. This will trigger a new request to the API when needed.
	 */
	public setParams(params: Params) {
		const req = this._strategy.createRequest(params);

		if (Array.isArray(req)) {
			throw new Error('Multiple requests are not supported yet');
		}

		const messageId = 0;
		if (req) {
			const cacheKey = JSON.stringify(req);

			if (cacheKey !== this._cacheKey[messageId]) {
				this.params = params;
				this._cacheKey[messageId] = cacheKey;
				this._cache[messageId] = undefined;

				this.setPending(true);

				req._nonce = messageId;

				const writer = this.tx.getWriter();
				writer.write(req);
				writer.releaseLock();

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

	public write = new WritableStream<Params>({
		write: (msg) => {
			console.log(msg);

			// this.setParams(msg);
		},
	});

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

	private rx: ReadableStream<ResponseMessage>;
	private tx: WritableStream<RequestMessage>;

	constructor(
		client: {
			stream(): readonly [ReadableStream<ResponseMessage>, WritableStream<RequestMessage>];
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
		// If a client connects after a request has been made, the request will run into the void.
		//  Not a concern here, since we connect in the constructor.
		const [read, write] = client.stream();
		this.rx = read;
		this.tx = write;

		this.rx
			?.pipeThrough(
				new TransformStream<ResponseMessage, Cache>({
					/**
					 * Handle response.
					 */
					transform: async (msg, controller) => {
						if (msg._type === MessageType.Error) {
							console.error('ohno an error, this should be handled!', msg.error);

							if (msg.error) {
								this.onError(msg.error);
							}
						} else {
							const res = await this._strategy.handleMessage(msg, this.params);
							if (res) controller.enqueue(res);
						}
					},
				})
			)
			?.pipeThrough(
				new TransformStream<Cache, Cache>({
					/**
					 * Cache the prepared data from the api.
					 */
					transform: async (msg, controller) => {
						const messageId = msg._nonce ? msg._nonce : 0;
						this._cache[messageId] = msg;
						controller.enqueue(msg);
					},
				})
			)
			.pipeTo(
				new WritableStream({
					/**
					 * Handles responses from the api.
					 */
					write: (msg) => {
						this.dispatch('data', this.processData());
						this.setPending(false);
					},
				})
			);
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
