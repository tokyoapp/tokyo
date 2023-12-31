import { MessageType } from '../lib.js';
import { Accessor } from '../Accessor.js';
import Worker from '../Worker.js';

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
        return {
          _type: MessageType.Index,
          locations: params.query.locations,
        };
      }
    },

    handleMessage(msg) {
      if (msg._type === MessageType.Index) return msg;
    },

    filter: ([data], params) => {
      console.log(params, data);

      function setIndex(index: IndexEntryMessage[]) {
        this.index[1](index);
        const stacks = this.stack(index.filter(this.filterItems).sort(this.sortItems));
        this.stacks[1](stacks);
      }

      function setFilter(options: {
        rating: number;
      }) {
        if (options.rating != null) {
          this.filterSettings[1]({
            rating: options.rating,
          });
        }
      }

      function setSorting(options: {
        rating: boolean;
        created: boolean;
      }) {
        if (options.rating != null) {
          this.sortSettings[1]({
            rating: options.rating,
          });
        }
        if (options.created != null) {
          this.sortSettings[1]({
            created: options.created,
          });
        }
      }

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
            (this.sortSettings[0].created ? this.sort.created(itemA, itemB) : 0) +
            (this.sortSettings[0].rating ? this.sort.rating(itemA, itemB) : 0);
        }
        return score;
      };

      const filterItems = (item: IndexEntryMessage) => {
        if (this.filterSettings[0].rating && item.rating < this.filterSettings[0].rating) {
          return false;
        }
        return true;
      };

      return data;
    },
  });
}
