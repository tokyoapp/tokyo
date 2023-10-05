use axum::extract::ws;
use axum::Router;
use axum::{
  extract::ws::{WebSocket, WebSocketUpgrade},
  routing::get,
};
use futures::sink::SinkExt;
use futures::StreamExt;
use phl_library::db::Root;
use phl_library::image::Metadata;
use phl_library::{db, Library};
use phl_proto::library;
use phl_proto::Message;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Deserialize, Serialize)]
struct FileInfo {
  file: String,
}

#[derive(Deserialize, Serialize)]
struct LibraryInfo {
  name: String,
}

#[derive(Deserialize, Serialize)]
struct OkResponse {
  ok: bool,
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
  let root = db::Root::new();
  let _ = root.init_db();

  let router = Router::new().route(
    "/ws",
    get(|ws: WebSocketUpgrade| async { ws.on_upgrade(move |socket| handle_socket(socket)) }),
  );

  println!("Running app on http://0.0.0.0:8000");

  axum::Server::bind(&"0.0.0.0:8000".parse().unwrap())
    .serve(router.into_make_service())
    .await
    .unwrap();
}

async fn metadata(file: &String) -> library::Message {
  let p = file;

  let meta = phl_library::image::metadat(&p.to_string());

  let mut msg = library::Message::new();

  if let Some(metadata) = meta {
    let root = db::Root::new();
    let file = Library::get_file(&root, &metadata.hash);

    let mut tags: Vec<String> = Vec::new();

    let rating = file
      .clone()
      .and_then(|f| Some(f.rating))
      .or(Some(metadata.rating as i32))
      .unwrap();

    if let Some(f) = file {
      tags.append(&mut f.tags.clone());
    } else {
      Library::add_file(&root, &metadata.hash, metadata.rating as i32).await;
    }

    let mut meta_msg = library::MetadataMessage::new();
    meta_msg.create_date = metadata.create_date;
    meta_msg.exif = serde_json::to_string(&metadata.exif).unwrap();
    meta_msg.hash = metadata.hash;
    meta_msg.height = metadata.height as i32;
    meta_msg.width = metadata.width as i32;
    meta_msg.make = metadata.make;
    meta_msg.name = metadata.name;
    meta_msg.orientation = metadata.orientation as i32;
    meta_msg.rating = rating;
    meta_msg.tags = tags;
    meta_msg.thumbnail = phl_library::image::cached_thumb(&p.to_string()).await;

    msg.set_metadata(meta_msg);
  }

  return msg;
}

fn get_location_list() -> library::LibraryListMessage {
  let root = db::Root::new();
  let list = root.location_list().unwrap();
  let tags = root.tags_list().unwrap();

  let mut list_msg = library::LibraryListMessage::new();
  list_msg.tags = tags
    .iter()
    .map(|t| {
      let mut m = library::TagMessage::new();
      m.id = t.id.clone();
      m.name = t.name.clone();
      return m;
    })
    .collect();
  list_msg.libraries = list
    .into_iter()
    .map(|loc| {
      let mut m = library::LibraryMessage::new();
      m.name = loc.name;
      m.path = loc.path;
      m
    })
    .collect();

  list_msg
}

fn get_index_msg(name: &str) -> library::LibraryIndexMessage {
  let root = db::Root::new();
  let dir = Library::find_library(&root, name).unwrap().path;
  let list = Library::list(dir);

  let mut index: Vec<Metadata> = Vec::new();

  for path in list {
    let meta = phl_library::image::metadat(&path);
    let _ = meta.is_some_and(|v| {
      index.push(v);
      true
    });
  }

  let mut index_msg = library::LibraryIndexMessage::new();
  index_msg.index = index
    .iter()
    .map(|meta| {
      let file = Library::get_file(&root, &meta.hash);
      let rating = file
        .clone()
        .and_then(|f| Some(f.rating))
        .or(Some(meta.rating as i32))
        .unwrap();

      let mut msg = library::IndexEntryMessage::new();
      msg.name = meta.name.clone();
      msg.create_date = meta.create_date.clone();
      msg.hash = meta.hash.clone();
      msg.orientation = meta.orientation as i32;
      msg.path = meta.path.clone();
      msg.rating = rating;
      msg.tags = file
        .and_then(|f| Some(f.tags))
        .or(Some(Vec::new()))
        .unwrap();
      msg
    })
    .collect();

  return index_msg;
}

async fn handle_socket(mut socket: WebSocket) {
  println!("Socket connected");

  // // send location list
  // let mut msg = library::Message::new();
  // msg.set_list(get_location_list());
  // let _ = socket
  //   .send(ws::Message::Binary(msg.write_to_bytes().unwrap()))
  //   .await;

  // send system info
  let mut sys_msg = library::Message::new();
  sys_msg.set_system(phl_library::Library::sysinfo().into());
  let _ = socket
    .send(ws::Message::Binary(sys_msg.write_to_bytes().unwrap()))
    .await;

  let (sender, mut receiver) = socket.split();

  let arc_sender = Arc::new(Mutex::new(sender));

  // Process incoming messages
  while let Some(msg) = receiver.next().await {
    let msg = if let Ok(msg) = msg {
      msg
    } else {
      // client disconnected
      return;
    };

    let data = msg.into_data();
    let msg = library::ClientMessage::parse_from_bytes(&data);

    if let Ok(ok_msg) = msg {
      let ws = arc_sender.clone();

      tokio::spawn(async move {
        if ok_msg.has_locations() {
          let mut msg = library::Message::new();
          msg.set_list(get_location_list());
          let packet = ws::Message::Binary(msg.write_to_bytes().unwrap());
          ws.lock().await.send(packet).await;
        }

        if ok_msg.has_index() {
          let index = ok_msg.index();
          println!("Requested Index {}", index.name);

          let mut msg = library::Message::new();
          msg.id = ok_msg.id;
          msg.set_index(get_index_msg(index.name.as_str()));
          let bytes = msg.write_to_bytes().unwrap();
          let packet = ws::Message::Binary(bytes);
          ws.lock().await.send(packet).await;
        }

        if ok_msg.has_create() {
          let root = Root::new();
          let create = ok_msg.create();
          let _cr = Library::create_library(&root, create.name.as_str(), create.path.as_str());

          if _cr.is_ok() {
            let mut msg = library::Message::new();
            msg.set_list(get_location_list());
            let bytes = msg.write_to_bytes().unwrap();
            let packet = ws::Message::Binary(bytes);
            ws.lock().await.send(packet).await;
          }
        }

        if ok_msg.has_meta() {
          let file = &ok_msg.meta().file;
          let mut msg = metadata(file).await;
          msg.id = ok_msg.id;
          let bytes = msg.write_to_bytes().unwrap();
          let packet = ws::Message::Binary(bytes);
          ws.lock().await.send(packet).await;
        }

        if ok_msg.has_image() {
          let file = &ok_msg.image().file; // should be the hash,
          let image = phl_library::image::cached_thumb(file).await; // then this doesnt need to look for the hash itself
          let mut img_msg = library::ImageMessage::new();
          img_msg.image = image;
          let mut msg = library::Message::new();
          msg.id = ok_msg.id;
          msg.set_image(img_msg);
          let bytes = msg.write_to_bytes().unwrap();
          let packet = ws::Message::Binary(bytes);
          ws.lock().await.send(packet).await;
        }

        if ok_msg.has_postmeta() {
          let file = &ok_msg.postmeta().file;
          let rating = ok_msg.postmeta().rating.unwrap();
          let root = Root::new();
          root.set_rating(file, rating).expect("Failed to set rating");

          let mut msg = library::Message::new();
          msg.id = ok_msg.id;
          msg.set_index(get_index_msg("default"));
          let bytes = msg.write_to_bytes().unwrap();
          let packet = ws::Message::Binary(bytes);
          ws.lock().await.send(packet).await;
        }
      });
    } else {
      let mut error_message = library::Message::new();
      error_message.error = Some(true);
      error_message.message = Some("Something went wrong".to_string());

      if arc_sender
        .lock()
        .await
        .send(ws::Message::Binary(
          error_message
            .write_to_bytes()
            .expect("Filed to write error message."),
        ))
        .await
        .is_err()
      {
        // client disconnected
        return;
      }
    }
  }
}
