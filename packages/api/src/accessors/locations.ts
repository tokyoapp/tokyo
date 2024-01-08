import { Accessor } from 'tokyo-accessors';
import * as proto from 'tokyo-proto';
import Worker from '../Worker.js';
import { MessageType } from '../lib.js';

export function createLocationsAccessor() {
	return new Accessor([Worker], {
		createRequest(query: unknown) {
			return [
				proto.ClientMessage.create({
					locations: proto.RequestLocations.create({}),
				}),
			];
			// Create a library
			// library.ClientMessage.create({
			//   create: library.CreateLibraryMessage.create({
			//     name: 'Desktop',
			//     path: '/Users/tihav/Desktop',
			//   }),
			// })
		},

		transform(msg) {
			if (msg.type === MessageType.Locations) return msg;
		},

		compute([data]) {
			return data?.data;
		},
	});
}
