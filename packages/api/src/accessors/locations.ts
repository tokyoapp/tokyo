import { MessageType } from '../lib.js';
import { Accessor } from '../Accessor.js';
import { LocalLibrary } from '../api/LocalLibrary.js';

export function createLocationsAccessor(hosts: string[]) {
	// TODO: for hosts, create api instance(s)

	const api = new LocalLibrary();

	return new Accessor(api, {
		createRequest() {
			return {
				_type: MessageType.Locations,
			};
		},

		handleMessage(msg) {
			if (msg._type === MessageType.Locations) {
				return {
					test: msg.locations
				};
			}
		},

		filter: ([data]) => data,
	});
}
