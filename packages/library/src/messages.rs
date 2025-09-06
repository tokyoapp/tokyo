use crate::IndexEntry;
use crate::Library;
use anyhow::Result;
use anyhow::anyhow;
use image::DynamicImage;
use image::EncodableLayout;
use image::imageops::FilterType;
use log::error;
use log::info;
use std::path::Path;
use tokio::time::Instant;

async fn metadata(lib: &Library, file: &Vec<String>) -> tokyo_schema::proto::Message {
  let mut msg = tokyo_schema::proto::Message::default();
  let mut entires_msg = tokyo_schema::proto::MetadataMessage::default();

  for f in file {
    let meta = lib.metadata(f.clone()).await;
    if let Some(metadata) = meta {
      let entry: tokyo_schema::proto::MetadataEntryMessage = metadata.into();
      entires_msg.entries.push(entry);
    } else {
      error!("Failed to get lib metadata for {}", f);
    }
  }

  msg.set_metadata(entires_msg);
  return msg;
}

async fn get_location_list(lib: &Library) -> tokyo_schema::proto::LibraryListMessage {
  let list = lib.list_locations().await.unwrap();
  let tags = lib.list_tags().await;

  let mut list_msg = tokyo_schema::proto::LibraryListMessage::default();
  list_msg.tags = tags
    .iter()
    .map(|t| {
      let mut m = tokyo_schema::proto::TagMessage::default();
      m.id = t.id.clone();
      m.name = t.name.clone();
      return m;
    })
    .collect();
  list_msg.libraries = list
    .into_iter()
    .map(|loc| {
      let mut m = tokyo_schema::proto::LibraryMessage::default();
      m.id = loc.id;
      m.name = loc.name;
      m.path = loc.path;
      m.library = "".to_string();
      m
    })
    .collect();

  list_msg
}

async fn get_index_msg(
  lib: &Library,
  ids: Vec<String>,
) -> tokyo_schema::proto::LibraryIndexMessage {
  let mut _index: Vec<IndexEntry> = Vec::new();

  for id in ids {
    let dir = lib.find_library(id.clone()).await.unwrap().path;

    // check if dir is a path or http address
    if dir.starts_with("ccapi:") {
      _index.append(&mut lib.get_index_ccapi(dir).await.expect("Failed to get index"));
      continue;
    } else {
      info!("[INDEX] {:?}, {:?}", dir, id);
      _index.append(&mut lib.get_index(dir).await.expect("Failed to get index"));
    }
  }

  let mut index_msg = tokyo_schema::proto::LibraryIndexMessage::default();
  index_msg.index = _index
    .into_iter()
    .map(|entry| {
      let msg: tokyo_schema::proto::IndexEntryMessage = entry.into();
      msg
    })
    .collect();

  return index_msg;
}

pub async fn edited_image(path: &String, edits_json: Option<String>) -> Result<DynamicImage> {
  let start = Instant::now();

  info!("Load image");
  // let image = tokyo_shadow::get_image(&Path::new(path)).await?;

  info!("Resize image");
  // let image = image.resize(2048, 2048, FilterType::Lanczos3);

  // let edits: tokyo_shadow::Edits = match edits_json {
  //   Some(json) => tokyo_shadow::Edits::from_json(json),
  //   _ => tokyo_shadow::Edits::new(),
  // };

  info!("Process image");
  // let img = tokyo_shadow::process(image.to_rgb32f(), &edits);
  let image = DynamicImage::default();

  info!("done in {}ms", start.elapsed().as_millis());

  Ok(image)
}

pub async fn handle_client_request(
  req: tokyo_schema::proto::ClientMessage,
) -> Result<tokyo_schema::proto::Message> {
  let lib = &Library::new().await;

  info!("Request: {:?}", req);

  if req.has_locations() {
    let mut msg = tokyo_schema::proto::Message::default();
    msg.nonce = req.nonce;
    msg.set_list(get_location_list(lib).await);
    return Ok(msg);
  }

  if req.has_index() {
    let mut msg = tokyo_schema::proto::Message::default();
    msg.nonce = req.nonce.clone();

    let index = req.index();
    info!("Requested Index {:?}", index);
    msg.set_index(get_index_msg(lib, index.ids.clone()).await);
    return Ok(msg);
  }

  if req.has_create() {
    let create = req.create();
    let _cr = lib
      .create_library(create.name.to_string(), create.path.to_string())
      .await;

    if _cr.is_ok() {
      let mut msg = tokyo_schema::proto::Message::default();
      msg.set_list(get_location_list(lib).await);
      return Ok(msg);
    }
  }

  if req.has_meta() {
    let file = &req.meta().file;
    let mut msg = metadata(lib, file).await;
    msg.nonce = req.nonce;
    return Ok(msg);
  }

  if req.has_image() {
    let file = &req.image().file; // should be the hash,
    let mut img_msg = tokyo_schema::proto::ImageMessage::default();
    let image = edited_image(file, req.image().edits.to_owned()).await?;
    let v = image.to_rgb8().as_bytes().to_vec();
    img_msg.image = v;
    img_msg.width = image.width() as i32;
    img_msg.height = image.height() as i32;
    let mut msg = tokyo_schema::proto::Message::default();
    msg.nonce = req.nonce;
    msg.set_image(img_msg);
    return Ok(msg);
  }

  if req.has_postmeta() {
    let file = &req.postmeta().file;
    let rating = req.postmeta().rating.unwrap();
    lib.set_rating(file.clone(), rating).await?;

    let mut msg = tokyo_schema::proto::Message::default();
    msg.nonce = req.nonce;
    msg.set_index(get_index_msg(lib, ["default".to_string()].to_vec()).await);
    return Ok(msg);
  }

  Err(anyhow!("Message was empty"))
}
