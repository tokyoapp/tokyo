import { Accessor } from 'tokyo-accessors';
import * as proto from 'tokyo-proto';
import Worker from '../Worker.js';
import { MessageType } from '../MessageTypes.js';
import { HostLibrary } from '../api/HostLibrary.js';

export function createImageAccessor() {
	return new Accessor([new HostLibrary()], {
		createRequest(query: { file: string; edits: string }) {
			return [
				proto.ClientMessage.create({
					image: proto.RequestImage.create({
						file: query.file,
						edits: query.edits,
					}),
				}),
			];
		},

		transform(msg) {
			if (msg.type === MessageType.Image) return msg;
			console.error(msg);
			window.dispatchEvent(new CustomEvent('error', { detail: msg.message }));
		},

		compute([data]) {
			const img = data?.data;

			if (!img) return;

			return {
				image: new Uint8Array(img.image?.buffer),
				width: img?.width,
				height: img?.height,
			};
		},
	});
}
