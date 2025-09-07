type ImageMeta = {
  orientation?: number;
  colorSpace?: "srgb";
};

type Drawable = HTMLCanvasElement | HTMLImageElement;

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");

  if (width) canvas.width = width;
  if (height) canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get 2d context");
  return {
    canvas,
    context,
  };
}

export class DynamicImage {
  static fromRaw(
    img: Uint8Array,
    width = 5472,
    height = 3648,
    meta?: ImageMeta
  ) {
    const canvas = document.createElement("canvas");
    const ctxt = canvas.getContext("2d");

    const data = new ImageData(width, height, {
      colorSpace: meta?.colorSpace || "srgb",
    });

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

  #canvas!: HTMLCanvasElement;
  #context!: CanvasRenderingContext2D;

  get width() {
    return this.#canvas.width;
  }

  get height() {
    return this.#canvas.height;
  }

  constructor(image?: Drawable, meta?: ImageMeta) {
    const { canvas, context } = createCanvas(
      image?.width || 0,
      image?.height || 0
    );
    this.#canvas = canvas;
    this.#context = context;

    if (image) this.fromDrawable(image, meta);
  }

  fromRaw(data: Uint8Array, width: number, height: number) {
    try {
      this.#canvas.width = width;
      this.#canvas.height = height;

      const imgData = this.#context.getImageData(0, 0, width, height);

      for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i + 0] = data[(i / 4) * 3 + 0];
        imgData.data[i + 1] = data[(i / 4) * 3 + 1];
        imgData.data[i + 2] = data[(i / 4) * 3 + 2];
        imgData.data[i + 3] = 255;
      }

      this.#context.putImageData(imgData, 0, 0);
    } catch (err) {
      console.error(err);
    }

    return this;
  }

  fromDrawable(image: Drawable, meta?: ImageMeta) {
    this.#canvas.width = image.width;
    this.#canvas.height = image.height;
    this.#context.drawImage(image, 0, 0);

    if (meta) {
      if (meta.orientation)
        switch (meta.orientation) {
          case 5:
          case 6:
            this.rotate90();
            break;
          case 7:
          case 8:
            this.rotate270();
            break;
        }
    }

    return this;
  }

  resize(width: number, height: number) {
    const { canvas, context } = createCanvas(width, height);

    context.drawImage(this.#canvas, 0, 0, width, height);

    return canvas;
  }

  /**
   * Resize image by the long side of the image.
   * @param width
   * @param height
   */
  resizeContain(size: number) {
    const ar = this.height / this.width;
    const length = Math.max(this.width, this.height);

    if (length === this.width) {
      this.#canvas = this.resize(size, size * ar);
    } else {
      this.#canvas = this.resize(size / ar, size);
    }

    return this;
  }

  canvas() {
    return this.#canvas;
  }

  async url() {
    return new Promise((resole, reject) => {
      this.#canvas.toBlob((blob) => {
        if (blob) return resole(URL.createObjectURL(blob));
        reject();
      });
    });
  }

  rotate90() {
    const { canvas, context } = createCanvas(
      this.#canvas.height,
      this.#canvas.width
    );
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((Math.PI / 180) * 90);
    context.drawImage(this.#canvas, -canvas.height / 2, -canvas.width / 2);
    this.#canvas = canvas;
    return this;
  }

  rotate180() {
    const { canvas, context } = createCanvas(
      this.#canvas.width,
      this.#canvas.height
    );
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((Math.PI / 180) * 180);
    context.drawImage(this.#canvas, -canvas.height / 2, -canvas.width / 2);
    this.#canvas = canvas;
    return this;
  }

  rotate270() {
    const { canvas, context } = createCanvas(
      this.#canvas.height,
      this.#canvas.width
    );
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((Math.PI / 180) * 270);
    context.drawImage(this.#canvas, -canvas.height / 2, -canvas.width / 2);
    this.#canvas = canvas;
    return this;
  }
}
