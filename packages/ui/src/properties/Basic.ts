import { Property } from "tokyo-properties";

export class Basic {
  title = "Exposure";

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

  temperature = Property.Float({
    default: 0,
    min: -1,
    max: 1,
  });

  tint = Property.Float({
    default: 0,
    min: -1,
    max: 1,
  });

  saturation = Property.Float({
    default: 0,
    min: -1,
    max: 1,
  });

  vibrancy = Property.Float({
    default: 0,
    min: -1,
    max: 1,
  });
}
