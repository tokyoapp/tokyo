import { Property } from 'tokyo-properties';

export class Basic {
  exposure = Property.Float({
    default: 1,
    min: -5,
    max: 5,
  });

  contrast = Property.Float({
    default: 1,
    min: -5,
    max: 5,
  });
}
