import { Accessor } from 'tokyo-accessors';
import * as proto from 'tokyo-proto';
import Worker from '../Worker.js';

export function createImageAccessor() {
	return new Accessor([Worker], {
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
			return msg;
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
