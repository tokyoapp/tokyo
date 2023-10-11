use core::panic;
use image::Pixel;
pub use image::{DynamicImage, ImageBuffer};
use rawler::{
  decoders::{RawDecodeParams, RawMetadata},
  get_decoder,
  imgop::raw,
  RawFile, RawImageData,
};
use std::{
  fs::File,
  io::{BufReader, Read},
  path::Path,
  path::PathBuf,
  str::FromStr,
};
// use xmp_toolkit;

// pub fn get_xmp_data(path: &Path) {
//   let filename = path.file_stem().unwrap().to_str().unwrap();
//   let xmp_file_path =
//     PathBuf::from(path.parent().unwrap().to_str().unwrap().to_owned() + "/" + filename + ".xmp");

//   let xmp = xmp_toolkit::XmpMeta::from_str(xmp_file_path).unwrap();
//   xmp.property("http://ns.adobe.com/xap/1.0/", "Rating");
// }

pub fn get_image(path: &Path) -> DynamicImage {
  let raw_file = File::open(&path).unwrap();
  let mut rawfile = RawFile::new(path, BufReader::new(raw_file));

  let metadata: Option<RawMetadata> = match get_decoder(&mut rawfile) {
    Ok(decoder) => Some(
      decoder
        .raw_metadata(&mut rawfile, RawDecodeParams { image_index: 0 })
        .unwrap(),
    ),
    Err(error) => {
      println!("Error reading metadata {}", error.to_string());
      None
    }
  };

  let raw_params = RawDecodeParams { image_index: 0 };
  let decoder = get_decoder(&mut rawfile).unwrap();
  let rawimage = decoder
    .raw_image(&mut rawfile, raw_params.clone(), false)
    .unwrap();

  if let Ok(mut params) = rawimage.develop_params() {
    // params.gamma = 1.8;

    let buf = match &rawimage.data {
      RawImageData::Integer(buf) => buf,
      RawImageData::Float(_) => todo!(),
    };

    println!("Develop image");
    let (srgbf, dim) = raw::develop_raw_srgb(buf, &params).unwrap();

    let mut img = DynamicImage::ImageRgb32F(
      ImageBuffer::from_raw(dim.w as u32, dim.h as u32, srgbf).expect("Invalid ImageBuffer size"),
    );

    img = match metadata.unwrap().exif.orientation.unwrap() {
      5 | 6 => img.rotate90(),
      7 | 8 => img.rotate270(),
      _ => img,
    };

    return img;
  }

  panic!("Fuck");
}
