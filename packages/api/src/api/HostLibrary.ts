import { request } from 'tauri-plugin-tokyo';
import * as library from 'tokyo-proto';
import { parseMessage } from '../MessageTypes.ts';

export class HostLibrary {
	stream() {
		let controller: ReadableStreamDefaultController<any>;

		const read = new ReadableStream<ReturnType<typeof parseMessage>>({
			start(ctlr) {
				controller = ctlr;
			},
		});

		const write = new WritableStream<library.ClientMessage>({
			async write(chunk) {
				const res = await request(library.ClientMessage.create(chunk));
				const msg = parseMessage(res);
				console.log(msg);
				controller.enqueue(msg);
			},
		});

		return [read, write] as const;
	}
}
