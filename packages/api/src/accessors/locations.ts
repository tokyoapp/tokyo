import { MessageType } from '../lib.js';
import { Accessor } from 'tokyo-accessors';
import Worker from '../Worker.js';
import * as proto from 'tokyo-proto';

export function createLocationsAccessor() {
  return new Accessor([Worker], {
    createRequest(params: {
      query: unknown;
    }) {
      return proto.ClientMessage.create({
        locations: proto.RequestLocations.create({}),
      });
      // Create a library
      // library.ClientMessage.create({
      //   create: library.CreateLibraryMessage.create({
      //     name: 'Desktop',
      //     path: '/Users/tihav/Desktop',
      //   }),
      // })
    },

    handleMessage(msg) {
      if (msg._type === MessageType.Locations) return msg;
    },

    filter: ([data]) => {
      return data.data;
    },
  });
}
