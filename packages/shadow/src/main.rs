use image::imageops::FilterType;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Image {
  pub height: u32,
  pub width: u32,
  pub data: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Edits {
  pub exposure: u32,
}

pub fn main() {
  println!("Run");

  render_image("/".into(), 1.0);
}

pub struct EditedImage {
  image: tokyo_shadow::DynamicImage,
  edits: tokyo_shadow::Edits,
}

impl EditedImage {
  pub fn new(path: &Path, edits: tokyo_shadow::Edits) -> EditedImage {
    let image = tokyo_shadow::get_image(path);

    EditedImage {
      image: image.unwrap(),
      edits,
    }
  }

  pub fn render(&mut self) -> tokyo_shadow::DynamicImage {
    let img = tokyo_shadow::process(&self.image, &self.edits);
    img
  }
}

pub fn render_image(path: String, exposure: f32) -> Image {
  let mut img = EditedImage::new(
    &Path::new(&path),
    tokyo_shadow::Edits {
      gamma: 2.4,
      exposure,
      curve: vec![(0.00, 0.00), (1.0, 1.0)],
    },
  );
  let resized = img.render().resize(1024, 1024, FilterType::Lanczos3);

  Image {
    width: resized.width(),
    height: resized.height(),
    data: resized.to_rgb8().to_vec(),
  }
}
