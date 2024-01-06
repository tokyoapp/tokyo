import { MessageType } from '../lib.js';
import { Accessor } from 'tokyo-accessors';
import Worker from '../Worker.js';
import * as proto from 'tokyo-proto';

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
