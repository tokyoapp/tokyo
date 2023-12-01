mod lib;

use image::codecs::tiff::TiffEncoder;
use std::{env, fs::File, path::PathBuf, time::Instant};

fn main() {
  let args: Vec<String> = env::args().collect();

  let now = Instant::now();

  let img = lib::get_image(&PathBuf::from(&args[1])).unwrap();

  let mut file = File::create("./out.tiff").unwrap();
  let e = TiffEncoder::new(&mut file);

  let mut resized = img.resize(1920, 1920, image::imageops::FilterType::Lanczos3);

  let elapsed_time = now.elapsed();
  println!("Developed in {} ms.", elapsed_time.as_millis());

  let processed = lib::process(&mut resized);

  let elapsed_time = now.elapsed();
  println!("Processed in {} ms.", elapsed_time.as_millis());

  processed.write_with_encoder(e).unwrap();

  let elapsed_time = now.elapsed();
  println!("Encoded in {} ms.", elapsed_time.as_millis());
}
