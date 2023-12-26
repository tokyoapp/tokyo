import { MessageType } from '../lib.js';
import { Accessor } from '../Accessor.js';
import { LocalLibrary } from '../api/LocalLibrary.js';

export function createLocationsAccessor() {
  return new Accessor([new LocalLibrary()], {
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

    filter: ([data]) => data,
  });
}
