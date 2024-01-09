use crate::IndexEntry;
use crate::Library;
use anyhow::anyhow;
use anyhow::Result;
use image::imageops::FilterType;
use image::DynamicImage;
use image::EncodableLayout;
use log::{debug, error, info, warn};
use std::path::Path;
use tokio::time::Instant;
use tokyo_proto::schema::MetadataEntryMessage;
use tokyo_proto::schema::{self, ClientMessage, IndexEntryMessage};

async fn metadata(lib: &Library, file: &Vec<String>) -> schema::Message {
  let mut msg = schema::Message::new();
  let mut entires_msg = schema::MetadataMessage::new();

  for f in file {
    let meta = lib.metadata(f.clone()).await;
    if let Some(metadata) = meta {
      let entry: MetadataEntryMessage = metadata.into();
      entires_msg.entries.push(entry);
    }
  }

  msg.set_metadata(entires_msg);
  return msg;
}

async fn get_location_list(lib: &Library) -> schema::LibraryListMessage {
  let list = lib.list_locations().await.unwrap();
  let tags = lib.list_tags().await;

  let mut list_msg = schema::LibraryListMessage::new();
  list_msg.tags = tags
    .iter()
    .map(|t| {
      let mut m = schema::TagMessage::new();
      m.id = t.id.clone();
      m.name = t.name.clone();
      return m;
    })
    .collect();
  list_msg.libraries = list
    .into_iter()
    .map(|loc| {
      let mut m = schema::LibraryMessage::new();
      m.id = loc.id;
      m.name = loc.name;
      m.path = loc.path;
      m.library = "".to_string();
      m
    })
    .collect();

  list_msg
}

async fn get_index_msg(lib: &Library, ids: Vec<String>) -> schema::LibraryIndexMessage {
  let mut _index: Vec<IndexEntry> = Vec::new();

  // TODO: this should be streamed
  for id in ids {
    let dir = lib.find_library(id.clone()).await.unwrap().path;
    info!("[INDEX] {:?}, {:?}", dir, id);
    let mut index = lib.get_index(dir).await.expect("Failed to get index");
    _index.append(&mut index);
  }

  let mut index_msg = schema::LibraryIndexMessage::new();
  index_msg.index = _index
    .into_iter()
    .map(|entry| {
      let msg: IndexEntryMessage = entry.into();
      msg
    })
    .collect();

  return index_msg;
}

pub async fn edited_image(path: &String, edits_json: Option<String>) -> Result<DynamicImage> {
  let start = Instant::now();

  info!("Load image");
  let image = tokyo_shadow::get_image(&Path::new(path)).await?;

  info!("Resize image");
  let image = image.resize(2048, 2048, FilterType::Lanczos3);

  let edits: tokyo_shadow::Edits = match edits_json {
    Some(json) => tokyo_shadow::Edits::from_json(json),
    _ => tokyo_shadow::Edits::new(),
  };

  info!("Process image");
  let img = tokyo_shadow::process(image.to_rgb32f(), &edits);
  let image = DynamicImage::ImageRgb32F(img);

  info!("done in {}ms", start.elapsed().as_millis());

  Ok(image)
}

pub async fn handle_client_request(req: ClientMessage) -> Result<schema::Message> {
  let lib = &Library::new().await;

  if req.has_locations() {
    let mut msg = schema::Message::new();
    msg.nonce = req.nonce;
    msg.set_list(get_location_list(lib).await);
    return Ok(msg);
  }

  if req.has_index() {
    let mut msg = schema::Message::new();
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
      let mut msg = schema::Message::new();
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
    let mut img_msg = schema::ImageMessage::new();
    let image = edited_image(file, req.image().edits.to_owned()).await?;
    let v = image.to_rgb8().as_bytes().to_vec();
    img_msg.image = v;
    img_msg.width = image.width() as i32;
    img_msg.height = image.height() as i32;
    let mut msg = schema::Message::new();
    msg.nonce = req.nonce;
    msg.set_image(img_msg);
    return Ok(msg);
  }

  if req.has_postmeta() {
    let file = &req.postmeta().file;
    let rating = req.postmeta().rating.unwrap();
    lib.set_rating(file.clone(), rating).await?;

    let mut msg = schema::Message::new();
    msg.nonce = req.nonce;
    msg.set_index(get_index_msg(lib, ["default".to_string()].to_vec()).await);
    return Ok(msg);
  }

  Err(anyhow!("Message was empty"))
}
