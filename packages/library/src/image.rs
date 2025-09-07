use anyhow::{Result, anyhow};
use image::imageops::FilterType;
use image::{imageops, ImageFormat};
use log::{error, info};
use rawler::decoders::{RawDecodeParams, RawMetadata};
use rawler::exif::Exif;
use rawler::rawsource::RawSource;
use rawler::{analyze::extract_thumbnail_pixels, get_decoder};
use std::io::Cursor;
use std::{
  fs::File,
  io::{Read},
  path::{Path, PathBuf},
};
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
    // TODO: use tokio File::open
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

pub fn metadata(path: &String) -> Result<Metadata> {
  let raw_file = File::open(&path);
  if raw_file.is_err() {
    return Err(anyhow!("File is error"));
  }

  let p = PathBuf::from(path.clone());

  let mut rawfile = RawSource::new(&p)?;

  if let Ok(decoder) = get_decoder(&rawfile) {
    let metadata = decoder
      .raw_metadata(&mut rawfile, &RawDecodeParams { image_index: 0 })
      .expect("Failed to get metadata");

    return Ok(Metadata {
      hash: file_hash(path).unwrap(),
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
    });
  }

  Ok(Metadata {
    hash: file_hash(path).unwrap(),
    name: String::from(p.file_name().unwrap().to_str().unwrap()),
    path: String::from(p.to_str().unwrap()),
    width: 0,
    height: 0,
    exif: Exif::default(),
    rating: 0,
    make: "".to_string(),
    create_date: "".to_string(),
    orientation: 0,
  })
}

pub fn file_hash(path: &String) -> Result<String> {
  let p = Path::new(&path);

  // Try to get metadata from raw files first
  if let Ok(mut rawfile) = RawSource::new(&p) {
    let meta: Option<RawMetadata> = match get_decoder(&rawfile) {
      Ok(decoder) => Some(
        decoder
          .raw_metadata(&mut rawfile, &RawDecodeParams { image_index: 0 })
          .unwrap(),
      ),
      Err(error) => {
        error!("Error reading metadata {}", error.to_string());
        None
      }
    };

    if let Some(metadata) = meta {
      if let Some(create_date) = metadata.exif.create_date {
        return Ok(sha256::digest(
          create_date + p.file_name().unwrap().to_str().unwrap(),
        ));
      }
    }
  }

  // Fall back to using file metadata for any file format
  let file_metadata = std::fs::metadata(p)?;
  let modified_time = file_metadata.modified()
    .unwrap_or_else(|_| std::time::SystemTime::UNIX_EPOCH);

  let time_string = format!("{:?}", modified_time);
  let filename = p.file_name().unwrap().to_str().unwrap();

  Ok(sha256::digest(time_string + filename))
}

pub fn thumbnail(path: String) -> Vec<u8> {
  let mut thumb = extract_thumbnail_pixels(path, &RawDecodeParams { image_index: 0 }).unwrap();
  // TODO: use my own io and use tokio::fs for this
  thumb = thumb.resize(thumb.width() / 5, thumb.height() / 5, FilterType::Nearest);

  let mut bytes: Vec<u8> = Vec::new();
  thumb
    .write_to(
      &mut Cursor::new(&mut bytes),
      image::ImageFormat::Jpeg,
    )
    .unwrap();

  return bytes;
}

pub async fn cached_thumb(p: &String) -> Vec<u8> {
  let ext = Path::new(&p).extension().unwrap().to_str().unwrap();
  match ext {
    "jpg" => {
      return fs::read(p.to_string()).await.unwrap();
    }
    "png" => {
      return fs::read(p.to_string()).await.unwrap();
    }
    &_ => {}
  }

  let hash = file_hash(p).unwrap();

  info!("hash of {}: {}", p, hash);

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
