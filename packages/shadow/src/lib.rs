use core::panic;
pub use image::{DynamicImage, ImageBuffer};
use imagepipe::{ImageSource, Pipeline};
use rawler::{
  decoders::{RawDecodeParams, RawMetadata},
  get_decoder,
  imgop::raw,
  RawFile, RawImageData,
};
use std::{fs::File, io::BufReader, path::Path};
// use xmp_toolkit;

// pub fn get_xmp_data(path: &Path) {
//   let filename = path.file_stem().unwrap().to_str().unwrap();
//   let xmp_file_path =
//     PathBuf::from(path.parent().unwrap().to_str().unwrap().to_owned() + "/" + filename + ".xmp");

//   let xmp = xmp_toolkit::XmpMeta::from_str(xmp_file_path).unwrap();
//   xmp.property("http://ns.adobe.com/xap/1.0/", "Rating");
// }
//

pub struct MyImage {
  pub image: DynamicImage,
  pub edits: Edits,
}

impl MyImage {
  pub fn new(path: &Path) -> MyImage {
    let image = get_image(path);

    MyImage {
      image,
      edits: Edits {
        gamma: 2.2,
        exposure: 0.0,
        curve: vec![(0.00, 0.00), (1.0, 1.0)],
      },
    }
  }

  pub fn render(&mut self) -> DynamicImage {
    println!("{:?}", self.edits.exposure);

    let img = process(&self.image, &self.edits);

    img
  }
}

pub struct Edits {
  pub gamma: f32,
  pub exposure: f32,
  pub curve: Vec<(f32, f32)>,
}

pub fn process(img: &DynamicImage, edits: &Edits) -> DynamicImage {
  println!("process image");
  let source = ImageSource::Other(img.clone());
  let mut pipeline = Pipeline::new_from_source(source).unwrap();

  // pipeline.ops.gamma. = edits.gamma;
  pipeline.ops.basecurve.exposure = edits.exposure;
  pipeline.ops.basecurve.points = edits.curve.clone();

  println!("generate ouput");

  let out = pipeline.output_16bit(None).unwrap();

  println!("convert ouput");

  return DynamicImage::ImageRgb16(
    ImageBuffer::from_raw(out.width as u32, out.height as u32, out.data).expect("F"),
  );
}

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
