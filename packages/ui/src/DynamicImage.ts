type ImageMeta = {
  orientation?: number;
  colorSpace?: 'srgb';
};

type Drawable = HTMLCanvasElement | HTMLImageElement;

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');

  if (width) canvas.width = width;
  if (height) canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get 2d context');
  return {
    canvas,
    context,
  };
}

export class DynamicImage {
  static from(img: Uint8Array, width = 5472, height = 3648, meta?: ImageMeta) {
    const canvas = document.createElement('canvas');
    const ctxt = canvas.getContext('2d');

    const data = new ImageData(width, height, { colorSpace: meta?.colorSpace || 'srgb' });

    for (let i = 0; i < data.data.length / 4; i++) {
      data.data[i * 4 + 0] = img[i * 3 + 0];
      data.data[i * 4 + 1] = img[i * 3 + 1];
      data.data[i * 4 + 2] = img[i * 3 + 2];
      data.data[i * 4 + 3] = 256;
    }

    canvas.width = data.width;
    canvas.height = data.height;
    ctxt?.putImageData(data, 0, 0);

    return new DynamicImage(canvas, meta);
  }

  #canvas: HTMLCanvasElement;
  #context: CanvasRenderingContext2D;

  constructor(image: Drawable, meta?: ImageMeta) {
    const { canvas, context } = createCanvas(image.width, image.height);
    this.#canvas = canvas;
    this.#context = context;

    this.#context.drawImage(image, 0, 0);

    if (meta) {
      if (meta.orientation)
        switch (meta.orientation) {
          case 8:
            this.rotate270();
            break;
        }
    }
  }

  toCanvas() {
    return this.#canvas;
  }

  rotate90() {
    // todo
  }

  rotate180() {
    // todo
  }

  rotate270() {
    const { canvas, context } = createCanvas(this.#canvas.height, this.#canvas.width);
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((Math.PI / 180) * 270);
    context.drawImage(this.#canvas, -canvas.height / 2, -canvas.width / 2);
    this.#canvas = canvas;
    return this;
  }
}
