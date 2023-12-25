import { MessageType } from '../lib.js';
import { Accessor } from '../Accessor.js';
import { LocalLibrary } from '../api/LocalLibrary.js';

export function createIndexAccessor(hosts: string[]) {
  // TODO: for hosts, create api instance(s)

  const api = new LocalLibrary();

  return new Accessor(api, {
    createRequest(params: {
      query: {
        locations: string[];
      };
    }) {
      return {
        _type: MessageType.Index,
        locations: params.query.locations,
      };
    },

    handleMessage(msg) {
      if (msg._type === MessageType.Index) return msg;
    },

    filter: ([data]) => data,
  });
}
