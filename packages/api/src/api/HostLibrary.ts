import { createLocation, index, locations, metadata, system, thumbnail } from 'tauri-plugin-tokyo';
import { LibraryInterface } from '../lib';

export class LocalLibrary implements LibraryInterface {
	public async fetchLocations() {
		return {
			type: 'locations' as const,
			data: await locations(),
		};
	}

	public async fetchIndex(locations: string[]) {
		if (locations.length > 0) {
			const res = {
				type: 'index' as const,
				data: await index(locations[0]),
			};
			return res;
		}
	}

	public async fetchThumbmails(ids: string[]) {
		if (ids.length > 0) {
			const res = {
				type: 'thumbnails' as const,
				data: await Promise.all(
					ids.map(async (id) => {
						return { thumbnail: await thumbnail(id), id };
					})
				),
			};
			return res;
		}
	}

	public async fetchMetadata(ids: string[]) {
		if (ids.length > 0) {
			const res = {
				type: 'metadata' as const,
				data: await Promise.all(
					ids.map(async (id) => {
						return { metadata: await metadata(id), id };
					})
				),
			};
			return res;
		}
	}

	async getMetadata(file: string) {
		return await metadata(file).then(async (meta) => {
			// const file = meta?.hash;
			// const thumbnail = meta?.thumbnail;
			// if (file && thumbnail) {
			//   const blob = new Blob([new Uint8Array(thumbnail)]);
			// }

			return {
				metadata: meta,
			};
		});
	}

	async postMetadata(
		file: string,
		metadata: {
			rating?: number;
			tags?: string[];
		}
	) {}

	async postLocation(name: string, path: string) {
		return await createLocation(name, path).catch((err) => {
			console.error('error', err);
		});
	}

	async getSystem() {
		return system()
			.then((info) => {
				return info;
			})
			.catch((err) => {
				console.error('error', err);
			});
	}

	async getIndex(name: string) {
		return index(name)
			.then((index) => {
				const loc = {
					host: 'files',
					name: name,
					path: '/',
					index: index,
				};
				return loc;
			})
			.catch((err) => {
				console.error('error', err);
			});
	}

	stream() {
		const self = this;

		let controller: ReadableStreamDefaultController<any>;

		const read = new ReadableStream({
			start(ctlr) {
				controller = ctlr;
			},
		});

		const write = new WritableStream({
			write(chunk) {
				switch (chunk._type) {
					case 'locations.mutate':
						self.postLocation(chunk.name, chunk.path);
						break;
					case 'locations':
						self.fetchLocations().then((msg) => {
							controller.enqueue(msg);
						});
						break;
					case 'index':
						self.fetchIndex(chunk.locations).then((msg) => {
							if (msg) controller.enqueue(msg);
						});
						break;
					case 'thumbnails':
						self.fetchThumbmails(chunk.ids).then((msg) => {
							if (msg) controller.enqueue(msg);
						});
						break;
					case 'metadata':
						self.fetchMetadata(chunk.ids).then((msg) => {
							if (msg) controller.enqueue(msg);
						});
						break;
					case 'metadata.mutate':
						console.warn('not implemented');
						break;
					default:
						console.error('chunk._type', chunk._type, 'no handled.');
				}
			},
		});

		return [read, write] as const;
	}
}
