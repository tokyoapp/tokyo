import { MessageType } from '../lib.js';
import { Accessor } from '../Accessor.js';
import Worker from '../Worker.js';

export function createLocationsAccessor() {
  return new Accessor([Worker], {
    createRequest(params: {
      query: unknown;
    }) {
      return {
        _type: MessageType.Locations,
      };
      // return {
      //   _type: MessageType.MutateLocations,
      //   path: params.path,
      //   name: params.name,
      // };
    },

    handleMessage(msg) {
      if (msg._type === MessageType.Locations) return msg;
    },

    filter: ([data]) => {
      return data.data;
    },
  });
}
