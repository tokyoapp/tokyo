import { MessageType } from '../lib.js';
import { Accessor } from '../Accessor.js';
import * as proto from 'tokyo-proto';
import Worker from '../Worker.js';
import { DynamicImage } from '../DynamicImage.js';

export function createMetadataAccessor() {
  const loadImage = (src: string): Promise<Image> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve(image);
        image.onload = null;
      };
      image.onerror = (err) => {
        reject('Error loading image');
      };
      image.src = src;
    });
  };

  const makeThumbnail = async (blob: Blob, meta: MetadataMessage) => {
    const dynimg = new DynamicImage();
    const url = URL.createObjectURL(blob);
    const image = await loadImage(url);
    dynimg.fromDrawable(image, meta).resizeContain(1025);
    const canvas = dynimg.canvas();
    return canvas;
  };

  return new Accessor([Worker], {
    createRequest(
      params: {
        query: {
          ids: string[];
        };
      },
      cache
    ) {
      if (params?.query) {
        // const ids = params.query.ids?.filter((id) => !cache[0]?.find((entry) => entry.id === id));
        const ids = params.query.ids;

        return proto.ClientMessage.create({
          meta: proto.RequestMetadata.create({
            file: ids,
          }),
        });
      }
    },

    async handleMessage(msg) {
      if (msg._type === MessageType.Metadata) {
        const entry = async (entry) => {
          const buff = new Uint8Array(entry.thumbnail);
          const blob = new Blob([buff]);
          return {
            ...entry,
            thumbnail: await makeThumbnail(blob, entry),
            id: entry.id,
            source_id: msg.source_id,
          };
        };

        const items = Promise.all(msg.data.entries.map(entry));
        return items;
      }
    },

    filter: ([data]) => data,
  });
}
