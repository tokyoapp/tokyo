use core::panic;
use image::Pixel;
pub use image::{DynamicImage, ImageBuffer};
use imagepipe::{gamma::OpGamma, ImageSource, Pipeline};
use rawler::{
  decoders::{RawDecodeParams, RawMetadata},
  get_decoder,
  imgop::raw,
  RawFile, RawImageData,
};
use std::{
  fs::File,
  io::BufReader,
  ops::{Deref, Mul},
  path::Path,
};
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
    let image = get_image(path).unwrap();

    MyImage {
      image,
      edits: Edits {
        gamma: 2.2,
        contrast: 0.0,
        exposure: 0.0,
        curve: vec![(0.0, 0.0), (1.0, 1.0)],
      },
    }
  }

  pub fn render(&mut self) -> DynamicImage {
    process(&mut self.image)
  }
}

//
//
//
//
//

struct Nodes {
  input: Node,
  output: Node,
}

impl Nodes {
  fn new() -> Nodes {
    let mut output = Node::new();
    let mut input = Node::new();

    input.connect(output);

    Nodes { output, input }
  }

  fn process(&self, input: Vec<u8>) {
    println!("process {:?}", input);
  }
}

struct Node {
  edits: Option<Edits>,
  input: Option<Box<Node>>,
  output: Option<Box<Node>>,
}

impl Node {
  fn new() -> Node {
    Node {
      edits: None,
      input: None,
      output: None,
    }
  }

  fn connect(&mut self, node2: Node) {
    self.output = Some(Box::new(node2));
  }
}

pub struct Edits {
  pub gamma: f32,
  pub exposure: f32,
  pub contrast: f32,
  pub curve: Vec<(f32, f32)>,
}

pub fn process(img: &mut DynamicImage) -> DynamicImage {
  let buffer = img.as_mut_rgb32f().unwrap();

  let mut nodes = Nodes::new();

  let n1 = Node::new();
  nodes.input.connect(n1);

  for pixel in buffer.pixels_mut() {
    pixel.apply_without_alpha(|p| p.mul(1.5));
  }

  DynamicImage::from(DynamicImage::ImageRgb32F(buffer.deref().clone()).to_rgb16())
}

pub fn get_image(path: &Path) -> Option<DynamicImage> {
  let raw_file = File::open(&path).unwrap();
  let mut rawfile = RawFile::new(path, BufReader::new(raw_file));
  let raw_params = RawDecodeParams { image_index: 0 };
  let decoder = get_decoder(&mut rawfile).unwrap();
  let rawimage = decoder
    .raw_image(&mut rawfile, raw_params.clone(), false)
    .unwrap();

  if let Ok(params) = rawimage.develop_params() {
    let buf = match &rawimage.data {
      RawImageData::Integer(buf) => buf,
      RawImageData::Float(_) => todo!(),
    };

    let (srgbf, dim) = raw::develop_raw_srgb(buf, &params).unwrap();

    let img = DynamicImage::ImageRgb32F(
      ImageBuffer::from_raw(dim.w as u32, dim.h as u32, srgbf).expect("Invalid ImageBuffer size"),
    );

    return Some(img);
  }
  None
}
