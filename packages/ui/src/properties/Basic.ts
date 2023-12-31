import { Property } from 'tokyo-properties';

// pub exposure: f32,
// pub contrast: f32,
// pub temperature: f32,
// pub tint: f32,
// pub highlights: f32,
// pub shadows: f32,
// pub blacks: f32,
// pub whites: f32,
// pub texture: f32,
// pub vibrancy: f32,
// pub saturation: f32,

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
