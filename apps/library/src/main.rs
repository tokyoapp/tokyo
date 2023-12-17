use axum::extract::ws;
use axum::Router;
use axum::{
  extract::ws::{WebSocket, WebSocketUpgrade},
  routing::get,
};
use futures::sink::SinkExt;
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokyo_files::{IndexEntry, Library};
use tokyo_proto::library::{self, IndexEntryMessage};
use tokyo_proto::Message;

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
  let root = tokyo_db::Root::new();
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
  let root = tokyo_db::Root::new();
  let meta = tokyo_files::Library::metadata(&root, &file).await;
  let mut msg = library::Message::new();
  if let Some(metadata) = meta {
    msg.set_metadata(metadata.into());
  }
  return msg;
}

fn get_location_list() -> library::LibraryListMessage {
  let root = tokyo_db::Root::new();
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
      m.id = loc.id;
      m.name = loc.name;
      m.path = loc.path;
      m.library = "".to_string();
      m
    })
    .collect();

  list_msg
}

async fn get_index_msg(ids: Vec<String>) -> library::LibraryIndexMessage {
  let root = tokyo_db::Root::new();

  let mut _index: Vec<IndexEntry> = Vec::new();

  // TODO: this should be streamed
  for id in ids {
    println!("{}", id);
    let dir = Library::find_library(&root, &id).unwrap().path;
    let mut index = Library::get_index(&root, dir).await;
    _index.append(&mut index);
  }

  let mut index_msg = library::LibraryIndexMessage::new();
  index_msg.index = _index
    .into_iter()
    .map(|entry| {
      let msg: IndexEntryMessage = entry.into();
      msg
    })
    .collect();

  return index_msg;
}

async fn handle_socket(mut socket: WebSocket) {
  println!("Socket connected");

  // send system info
  let mut sys_msg = library::Message::new();
  sys_msg.set_system(tokyo_files::Library::sysinfo().into());
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
          msg.id = ok_msg.id;
          msg.set_list(get_location_list());
          let packet = ws::Message::Binary(msg.write_to_bytes().unwrap());
          ws.lock().await.send(packet).await;
        }

        if ok_msg.has_index() {
          let index = ok_msg.index();
          println!("Requested Index {:?}", index);
          let mut msg = library::Message::new();
          msg.id = ok_msg.id;
          msg.set_index(get_index_msg(index.ids.clone()).await);
          let bytes = msg.write_to_bytes().unwrap();
          let packet = ws::Message::Binary(bytes);
          ws.lock().await.send(packet).await;
        }

        if ok_msg.has_create() {
          let root = tokyo_db::Root::new();
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
          let image = tokyo_files::image::cached_thumb(file).await; // then this doesnt need to look for the hash itself
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
          let root = tokyo_db::Root::new();
          root.set_rating(file, rating).expect("Failed to set rating");

          let mut msg = library::Message::new();
          msg.id = ok_msg.id;
          msg.set_index(get_index_msg(["default".to_string()].to_vec()).await);
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
