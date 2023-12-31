use image::{imageops::FilterType, DynamicImage};
use std::path::Path;
use tokyo_shadow::{get_image, process, Edits};

pub fn main() {
  process_image("./media/_MGC4396.CR3", "./media/out.png");
}

pub fn process_image(file: &str, output: &str) {
  let image = get_image(&Path::new(&file)).expect("Failed to get image");

  let resized = image.resize(2048, 2048, FilterType::Lanczos3);
  let img = process(resized.to_rgb32f(), &Edits::new());

  DynamicImage::ImageRgb16(DynamicImage::ImageRgb32F(img).to_rgb16())
    .save(output)
    .unwrap();
}
