import { MessageType } from '../lib.js';
import { Accessor } from '../Accessor.js';
import Worker from '../Worker.js';

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
    createRequest(params: {
      query: {
        ids: string[];
      };
    }) {
      if (params.query)
        return {
          _type: MessageType.Thumbnails,
          ids: params.query.ids?.filter((id) => !cache.find((entry) => entry.id === id)),
        };
    },

    async handleMessage(msg) {
      if (msg._type === MessageType.Locations) {
        const items = Promise.all(
          msg.data.map(async (entry) => {
            const buff = new Uint8Array(entry.metadata.thumbnail);
            const blob = new Blob([buff]);
            return {
              ...entry.metadata,
              thumbnail: await makeThumbnail(blob, entry.metadata),
              id: entry.id,
              source_id: msg.source_id,
            };
          })
        );

        return items;
      }
    },

    filter: ([data]) => data,
  });
}
