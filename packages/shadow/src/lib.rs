use image::imageops::FilterType;
pub use image::{DynamicImage, ImageBuffer};
use rawler::{
  analyze::extract_thumbnail_pixels,
  decoders::{RawDecodeParams, RawMetadata},
  get_decoder,
  imgop::{raw, rescale_f32_to_u8},
  RawFile, RawImageData,
};
use std::{
  fs::File,
  io::{BufReader, Read},
  path::{Path, PathBuf},
};
use std::{io::Cursor, time::Instant};
use tokio::fs;

#[derive(serde::Serialize, Debug)]
pub struct Metadata {
  pub hash: String,
  pub path: String,
  pub name: String,
  pub create_date: String,
  pub rating: u32,
  pub width: u32,
  pub height: u32,
  pub make: String,
  pub exif: rawler::exif::Exif,
  pub orientation: u16,
}

pub fn get_rating(path: String) -> Option<u32> {
  let p = PathBuf::from(path.clone());
  let filename = p.file_stem().unwrap().to_str().unwrap();
  let xmp_file_path =
    PathBuf::from(p.parent().unwrap().to_str().unwrap().to_owned() + "/" + filename + ".xmp");

  if xmp_file_path.exists() {
    let mut xmp_file = File::open(&xmp_file_path).unwrap();
    let mut buffer = String::new();
    let _ = xmp_file.read_to_string(&mut buffer);

    let data = buffer.to_string();
    let d = &data;
    let doc = roxmltree::Document::parse(d).unwrap();
    let elem = doc
      .descendants()
      .find(|n| n.has_tag_name("Description"))
      .unwrap();

    let value = elem.attribute(("http://ns.adobe.com/xap/1.0/", "Rating"));

    if value.is_some() {
      let numb = value.unwrap().parse::<u32>();
      if numb.is_ok() {
        return Some(numb.unwrap());
      }
    }
  }

  return None;
}

pub fn metadat(path: &String) -> Option<Metadata> {
  let raw_file = File::open(&path);

  if raw_file.is_err() {
    return None;
  }

  let p = PathBuf::from(path.clone());
  let reader = BufReader::new(raw_file.unwrap());
  let mut rawfile = RawFile::new(&p, reader);

  let meta: Option<RawMetadata> = match get_decoder(&mut rawfile) {
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

  match meta {
    Some(metadata) => {
      let hash = sha256::digest(
        metadata.exif.create_date.clone().unwrap() + p.file_name().unwrap().to_str().unwrap(),
      );

      Some(Metadata {
        hash,
        name: String::from(p.file_name().unwrap().to_str().unwrap()),
        path: String::from(p.to_str().unwrap()),
        width: 0,
        height: 0,
        exif: metadata.exif.clone(),
        rating: metadata
          .rating
          .or(get_rating(path.to_string()))
          .or(Some(0))
          .unwrap(),
        make: metadata.make,
        create_date: metadata.exif.create_date.unwrap(),
        orientation: metadata.exif.orientation.unwrap(),
      })
    }
    None => None,
  }
}

pub fn thumbnail(path: String) -> Vec<u8> {
  let mut thumb = extract_thumbnail_pixels(path, RawDecodeParams { image_index: 0 }).unwrap();
  // TODO: use my own io and use tokio::fs for this
  thumb = thumb.resize(thumb.width() / 5, thumb.height() / 5, FilterType::Nearest);

  let mut bytes: Vec<u8> = Vec::new();
  thumb
    .write_to(
      &mut Cursor::new(&mut bytes),
      image::ImageOutputFormat::Jpeg(85),
    )
    .unwrap();

  return bytes;
}

pub async fn cached_thumb(p: &String) -> Vec<u8> {
  // TODO: save the read call here, hash in param
  let bytes = fs::read(p.to_string()).await.unwrap(); // Vec<u8>

  let ext = Path::new(&p).extension().unwrap().to_str().unwrap();
  match ext {
    "jpg" => {
      return bytes;
    }
    "png" => {
      return bytes;
    }
    &_ => {}
  }

  let hash = sha256::digest(&bytes);

  println!("hash of {}: {}", p, hash);

  let cache_dir = "./data/tmp";

  let thumbnail_path = cache_dir.to_owned() + "/" + &hash + ".jpg";

  if Path::new(&thumbnail_path).exists() {
    return fs::read(&thumbnail_path).await.unwrap();
  } else {
    // TODO: this is slow
    let thumb = thumbnail(p.to_string());

    let _ = fs::create_dir_all(cache_dir).await;
    let _ = fs::write(thumbnail_path, &thumb).await;

    return thumb;
  }
}

pub fn open(path: String) -> DynamicImage {
  let start = Instant::now();
  println!("read file {}", path);

  let raw_file = File::open(&path).unwrap();
  let mut rawfile = RawFile::new(PathBuf::from(path), BufReader::new(raw_file));

  println!("start decode {}", start.elapsed().as_millis());

  let raw_params = RawDecodeParams { image_index: 0 };
  let decoder = get_decoder(&mut rawfile).unwrap();
  let rawimage = decoder
    .raw_image(&mut rawfile, raw_params.clone(), false)
    .unwrap();

  println!("develop {}", start.elapsed().as_millis());

  let full_img = match rawimage.develop_params() {
    Ok(params) => {
      let buf = match &rawimage.data {
        RawImageData::Integer(buf) => buf,
        RawImageData::Float(_) => todo!(),
      };
      let (srgbf, dim) = raw::develop_raw_srgb(buf, &params).unwrap();
      println!("reformat {}", start.elapsed().as_millis());
      let output = rescale_f32_to_u8(&srgbf, 0, u8::MAX);
      let img = DynamicImage::ImageRgb8(
        ImageBuffer::from_raw(dim.w as u32, dim.h as u32, output)
          .expect("Invalid ImageBuffer size"),
      );
      Some(img)
    }
    Err(err) => {
      println!("Err | {}", err);
      None
    }
  };

  println!("time done {}", start.elapsed().as_millis());

  let img = full_img.unwrap();

  return img;
}
