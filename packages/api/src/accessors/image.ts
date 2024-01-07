import { Accessor } from 'tokyo-accessors';
import Worker from '../Worker.js';
import * as proto from 'tokyo-proto';

export function createImageAccessor() {
  return new Accessor([Worker], {
    createRequest(query: { file: string }) {
      return [
        proto.ClientMessage.create({
          image: proto.RequestImage.create({
            file: query.file
          })
        }),
      ];
    },

    transform(msg) {
      return msg;
    },

    compute([data]) {
      const img = data?.data;

      if (!img) return;

      return {
        image: new Uint8Array(img.image?.buffer),
        width: img?.width,
        height: img?.height,
      };
    },
  });
}
