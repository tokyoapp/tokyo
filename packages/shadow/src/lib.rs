use anyhow::anyhow;
use image::{DynamicImage, ImageBuffer};
use image::{Pixel, Rgb};
use log::{error, info};
use rawler::buffer::Buffer;
use rawler::imgop::develop::RawDevelop;
use rawler::{
  decoders::{RawDecodeParams, RawMetadata},
  get_decoder, RawFile,
};
use serde::{Deserialize, Serialize};
use std::path::Path;
use tokio::fs::File;
use tokio::io::{self, AsyncReadExt};

pub async fn get_image(path: &Path) -> anyhow::Result<DynamicImage> {
  let mut file = File::open(&path).await.unwrap();
  let mut buffer = Vec::new();
  file.read_to_end(&mut buffer).await?;

  let buf = Buffer::from(buffer);
  let mut rawfile = RawFile::from(buf);

  let params = RawDecodeParams { image_index: 0 };

  let metadata: Option<RawMetadata> = match get_decoder(&mut rawfile) {
    Ok(decoder) => Some(decoder.raw_metadata(&mut rawfile, params.clone()).unwrap()),
    Err(error) => {
      error!("Error reading metadata {}", error.to_string());
      None
    }
  };

  if let Ok(decoder) = get_decoder(&mut rawfile) {
    let rawimage = decoder.raw_image(&mut rawfile, params, false)?;

    let dev = RawDevelop::default();
    let mut img = dev
      .develop_intermediate(&rawimage)
      .unwrap()
      .to_dynamic_image()
      .unwrap();
    // spits out a srg gamma 2.4 image

    img = match metadata.unwrap().exif.orientation.unwrap() {
      5 | 6 => img.rotate90(),
      7 | 8 => img.rotate270(),
      _ => img,
    };

    return Ok(img);
  }

  Err(anyhow!("Failed to get image"))
}

/**
 * relative changes to image properties
 */
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Edits {
  pub exposure: f32,
  pub contrast: f32,
  pub temperature: f32,
  pub tint: f32,
  pub highlights: f32,
  pub shadows: f32,
  pub blacks: f32,
  pub whites: f32,
  pub texture: f32,
  pub vibrancy: f32,
  pub saturation: f32,
  pub curve_tone: Vec<(f32, f32)>,
  pub curve_red: Vec<(f32, f32)>,
  pub curve_green: Vec<(f32, f32)>,
  pub curve_blue: Vec<(f32, f32)>,
}

impl Edits {
  pub fn new() -> Edits {
    Edits {
      exposure: 0.4,
      contrast: 0.03,
      temperature: 0.15,
      tint: 0.0,
      highlights: -0.22,
      shadows: 0.15,
      blacks: 0.0,
      whites: 0.0,
      vibrancy: 0.0,
      saturation: 0.0,
      texture: 0.1,
      curve_tone: vec![],
      curve_red: vec![],
      curve_green: vec![],
      curve_blue: vec![],
    }
  }

  pub fn from_json(str: String) -> Edits {
    let edits: Edits = serde_json::from_str(&str).expect("Failed to parse edits");
    edits
  }
}

fn mat_mul(matrix: &[[f32; 3]; 3], vector: &[f32; 3]) -> [f32; 3] {
  let mut result = [0.0; 3];
  for i in 0..3 {
    for j in 0..3 {
      result[i] += matrix[i][j] * vector[j];
    }
  }
  result
}

fn exposure(rgb: [f32; 3], exposure: f32) -> [f32; 3] {
  let mut color = rgb;
  color[0] = color[0] * (1.0 + exposure);
  color[1] = color[1] * (1.0 + exposure);
  color[2] = color[2] * (1.0 + exposure);
  color
}

fn contrast(rgb: [f32; 3], contrast: f32) -> [f32; 3] {
  let mut color = rgb;
  color[0] = color[0] - 0.5 * (1.0 + contrast) + 0.5;
  color[1] = color[1] - 0.5 * (1.0 + contrast) + 0.5;
  color[2] = color[2] - 0.5 * (1.0 + contrast) + 0.5;
  color
}

fn saturation(color: [f32; 3], saturation: f32) -> [f32; 3] {
  let [r, g, b] = color;

  let sat = 0.3 * r + 0.59 * g + 0.11 * b;

  [
    sat + (1.0 + saturation) * (r - sat),
    sat + (1.0 + saturation) * (g - sat),
    sat + (1.0 + saturation) * (b - sat),
  ]
}

fn vibrancy(color: [f32; 3], vibrancy: f32) -> [f32; 3] {
  let [r, g, b] = color;

  let sat = 0.3 * r + 0.59 * g + 0.11 * b;

  [
    sat + (1.0 + vibrancy * sat) * (r - sat),
    sat + (1.0 + vibrancy * sat) * (g - sat),
    sat + (1.0 + vibrancy * sat) * (b - sat),
  ]
}

/**
 * Color temperature acording to CIE 1960 color space
 */
fn temprature(color: [f32; 3], temp: f32, tint: f32) -> [f32; 3] {
  let [x, y, z] = color;

  let mut u = (2.0 / 3.0) * x;
  let mut v = y;
  let mut w = (1.0 / 2.0) * (-x + 3.0 * y + z);

  u = u * (1.0 + tint);
  w = w * (1.0 + temp);

  let X = (3.0 / 2.0) * u;
  let Y = v;
  let Z = (3.0 / 2.0) * u - 3.0 * v + 2.0 * w;

  [X, Y, Z]
}

pub fn process(
  source: ImageBuffer<Rgb<f32>, Vec<f32>>,
  paramters: &Edits,
) -> ImageBuffer<Rgb<f32>, Vec<f32>> {
  let mut source = source;

  for pixel in source.pixels_mut() {
    let out = pixel.channels_mut();
    let linear_srgb = srgb::gamma::linear_from_normalised([out[0], out[1], out[2]]);

    // in

    let source_colorspace = kolor::spaces::LINEAR_SRGB;
    let working_colorspace = kolor::spaces::ACES2065_1;
    let target_colorspace = kolor::spaces::LINEAR_SRGB;

    let conversion_source = kolor::ColorConversion::new(source_colorspace, kolor::spaces::CIE_XYZ);
    let mut xyz = conversion_source.convert(linear_srgb.into());

    xyz = temprature(xyz.clone().into(), paramters.temperature, paramters.tint).into();

    let conversion_source = kolor::ColorConversion::new(kolor::spaces::CIE_XYZ, working_colorspace);
    let mut aces = conversion_source.convert(xyz.into());

    aces = exposure(aces.clone().into(), paramters.exposure).into();
    aces = contrast(aces.clone().into(), paramters.contrast).into();
    // highlights
    // shadows
    // blacks
    // whites
    aces = vibrancy(aces.clone().into(), paramters.vibrancy).into();
    aces = saturation(aces.clone().into(), paramters.saturation).into();

    let conversion_target = kolor::ColorConversion::new(working_colorspace, target_colorspace);
    let linear_srgb = conversion_target.convert(aces);

    // out

    let srgb_out = srgb::gamma::normalised_from_linear(linear_srgb);
    out[0] = srgb_out[0];
    out[1] = srgb_out[1];
    out[2] = srgb_out[2];
  }

  return source;
}
