import { Accessor } from 'tokyo-accessors';
import * as proto from 'tokyo-proto';
import { DynamicImage } from '../DynamicImage.js';
import { MessageType } from '../MessageTypes.js';
import Worker from '../Worker.js';
import { HostLibrary } from '../api/HostLibrary.js';

export function createMetadataAccessor() {
	const loadImage = (src: string): Promise<Image> => {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => {
				resolve(image);
				image.onload = null;
			};
			image.onerror = (err) => {
				reject('Error loading image');
			};
			image.src = src;
		});
	};

	const makeThumbnail = async (blob: Blob, meta: any) => {
		const dynimg = new DynamicImage();
		const url = URL.createObjectURL(blob);
		const image = await loadImage(url);
		dynimg.fromDrawable(image, meta).resizeContain(1025);
		const canvas = dynimg.canvas();
		return canvas;
	};

	return new Accessor([new HostLibrary()], {
		createRequest(query: {
			ids: string[];
		}) {
			// const ids = params.query.ids?.filter((id) => !cache[0]?.find((entry) => entry.id === id));
			return [
				proto.ClientMessage.create({
					meta: proto.RequestMetadata.create({
						file: query.ids,
					}),
				}),
			];
		},

		async transform(msg) {
			if (msg.type === MessageType.Metadata) {
				const entry = async (entry) => {
					const buff = new Uint8Array(entry.thumbnail);
					const blob = new Blob([buff]);
					return {
						...entry,
						thumbnail: await makeThumbnail(blob, entry),
						id: entry.id,
						source_id: msg.source_id,
					};
				};

				const items = Promise.all(msg.data.entries.map(entry));
				return items;
			}
		},

		compute: ([data]) => data,
	});
}
