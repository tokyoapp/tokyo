import * as Comlink from 'comlink';
import * as library from 'tokyo-proto';
import RemoteLibrary from './api/RemoteLibrary.ts?worker';

type Remote = typeof import('./api/RemoteLibrary.ts').default;
type Message = ReturnType<Remote['parseMessage']>;

export default {
	stream() {
		const url = '127.0.0.1:8000/ws';

		const worker = new RemoteLibrary();
		const wrappedWorker = Comlink.wrap<Remote>(worker);

		worker.onerror = (err) => {
			console.error('Error in worker:', err);
		};

		wrappedWorker.connect(url);

		const read = new ReadableStream<Message>({
			start(ctlr) {
				wrappedWorker.onMessage(
					Comlink.proxy((msg) => {
						ctlr.enqueue(msg);
					})
				);
			},
		});

		const write = new WritableStream<library.ClientMessage>({
			write(chunk) {
				wrappedWorker.send(chunk);
			},
		});

		return [read, write] as const;
	},
};
