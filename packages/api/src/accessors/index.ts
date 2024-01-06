import { MessageType } from '../lib.js';
import { Accessor } from 'tokyo-accessors';
import Worker from '../Worker.js';
import { IndexEntryMessage } from 'tokyo-proto';
import * as proto from 'tokyo-proto';

export function createIndexAccessor() {
  return new Accessor([Worker], {
    createRequest(params: {
      query: {
        locations: string[];
      };
      filterRating: number;
      sortRating: boolean;
      sortCreated: boolean;
    }) {
      if (params?.query) {
        return proto.ClientMessage.create({
          index: proto.RequestLibraryIndex.create({
            ids: params.query.locations,
          }),
        });
        // return {
        //   _type: MessageType.Index,
        //   locations: params.query.locations,
        // };
      }
    },

    handleMessage(msg) {
      if (msg._type === MessageType.Index) return msg;
    },

    filter: ([data], params) => {
      const items = data.data.index;

      const sort = {
        rating: (a: IndexEntryMessage, b: IndexEntryMessage) => {
          return +b.rating - +a.rating;
        },
        created: (a: IndexEntryMessage, b: IndexEntryMessage) => {
          const dateASlice = a.create_date.split(' ');
          dateASlice[0] = dateASlice[0].replaceAll(':', '-');
          const dateA = new Date(dateASlice.join(' '));

          const dateBSlice = b.create_date.split(' ');
          dateBSlice[0] = dateBSlice[0].replaceAll(':', '-');
          const dateB = new Date(dateBSlice.join(' '));

          return Math.sign(dateA.valueOf() - dateB.valueOf());
        },
      };

      function stack(items: IndexEntryMessage[]) {
        const stacked = [];

        _stack: for (const item of items) {
          for (const stacked_item of stacked) {
            const _item = stacked_item[0];
            if (_item.hash === item.hash) {
              stacked_item.push(_item);
              continue _stack;
            }
          }
          stacked.push([item]);
        }

        return stacked;
      }

      const sortItems = (itemA: IndexEntryMessage, itemB: IndexEntryMessage) => {
        let score = 0;
        if (itemA && itemB) {
          score =
            (params?.sortCreated ? sort.created(itemA, itemB) : 0) +
            (params?.sortRating ? sort.rating(itemA, itemB) : 0);
        }
        return score;
      };

      const filterItems = (item: IndexEntryMessage) => {
        if (params?.filterRating && item.rating < params?.filterRating) {
          return false;
        }
        return true;
      };

      return stack(items.filter(filterItems).sort(sortItems));
    },
  });
}
