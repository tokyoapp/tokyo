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
use tokyo_library::Library;
use tokyo_proto::library::{self, ClientMessage};
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
pub async fn init() {
  Library::new().await.init().await;

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

// async fn metadata(lib: Arc<Mutex<Library>>, file: &String) -> library::Message {
//   let meta = lib.lock().await.metadata(file.clone()).await;
//   let mut msg = library::Message::new();
//   if let Some(metadata) = meta {
//     msg.set_metadata(metadata.into());
//   }
//   return msg;
// }

// async fn get_location_list(lib: Arc<Mutex<Library>>) -> library::LibraryListMessage {
//   let list = lib.lock().await.list_locations().await.unwrap();
//   let tags = lib.lock().await.list_tags().await;

//   let mut list_msg = library::LibraryListMessage::new();
//   list_msg.tags = tags
//     .iter()
//     .map(|t| {
//       let mut m = library::TagMessage::new();
//       m.id = t.id.clone();
//       m.name = t.name.clone();
//       return m;
//     })
//     .collect();
//   list_msg.libraries = list
//     .into_iter()
//     .map(|loc| {
//       let mut m = library::LibraryMessage::new();
//       m.id = loc.id;
//       m.name = loc.name;
//       m.path = loc.path;
//       m.library = "".to_string();
//       m
//     })
//     .collect();

//   list_msg
// }

// async fn get_index_msg(lib: Arc<Mutex<Library>>, ids: Vec<String>) -> library::LibraryIndexMessage {
//   let lib = lib.lock().await;

//   let mut _index: Vec<IndexEntry> = Vec::new();

//   // TODO: this should be streamed
//   for id in ids {
//     println!("{}", id);
//     let dir = lib.find_library(id).await.unwrap().path;
//     let mut index = lib.get_index(dir).await;
//     _index.append(&mut index);
//   }

//   let mut index_msg = library::LibraryIndexMessage::new();
//   index_msg.index = _index
//     .into_iter()
//     .map(|entry| {
//       let msg: IndexEntryMessage = entry.into();
//       msg
//     })
//     .collect();

//   return index_msg;
// }

async fn handle_socket_message(
  ok_msg: ClientMessage,
  lib: Arc<Mutex<Library>>,
) -> Option<ws::Message> {
  lib.lock().await.metadata("/as".to_string()).await;
  // lib.init().await;

  // if ok_msg.has_locations() {
  //   let mut msg = library::Message::new();
  //   msg.id = ok_msg.id;
  //   msg.set_list(get_location_list(lib).await);
  //   let packet = ws::Message::Binary(msg.write_to_bytes().unwrap());
  //   return Some(packet);
  // }

  // if ok_msg.has_index() {
  //   let index = ok_msg.index();
  //   println!("Requested Index {:?}", index);
  //   let mut msg = library::Message::new();
  //   msg.id = ok_msg.id;
  //   msg.set_index(get_index_msg(lib, index.ids.clone()).await);
  //   let bytes = msg.write_to_bytes().unwrap();
  //   let packet = ws::Message::Binary(bytes);
  //   return Some(packet);
  // }

  // if ok_msg.has_create() {
  //   let create = ok_msg.create();
  //   let _cr = lib
  //     .lock()
  //     .await
  //     .create_library(create.name.to_string(), create.path.to_string())
  //     .await;

  //   if _cr.is_ok() {
  //     let mut msg = library::Message::new();
  //     msg.set_list(get_location_list(lib).await);
  //     let bytes = msg.write_to_bytes().unwrap();
  //     let packet = ws::Message::Binary(bytes);
  //     return Some(packet);
  //   }
  // }

  // if ok_msg.has_meta() {
  //   let file = &ok_msg.meta().file;
  //   let mut msg = metadata(lib, file).await;
  //   msg.id = ok_msg.id;
  //   let bytes = msg.write_to_bytes().unwrap();
  //   let packet = ws::Message::Binary(bytes);
  //   return Some(packet);
  // }

  // if ok_msg.has_image() {
  //   let file = &ok_msg.image().file; // should be the hash,
  //   let image = tokyo_library::cached_thumb(file).await; // then this doesnt need to look for the hash itself
  //   let mut img_msg = library::ImageMessage::new();
  //   img_msg.image = image;
  //   let mut msg = library::Message::new();
  //   msg.id = ok_msg.id;
  //   msg.set_image(img_msg);
  //   let bytes = msg.write_to_bytes().unwrap();
  //   let packet = ws::Message::Binary(bytes);
  //   return Some(packet);
  // }

  // if ok_msg.has_postmeta() {
  //   let file = &ok_msg.postmeta().file;
  //   let rating = ok_msg.postmeta().rating.unwrap();
  //   lib.lock().await.set_rating(file.clone(), rating).await;

  //   let mut msg = library::Message::new();
  //   msg.id = ok_msg.id;
  //   msg.set_index(get_index_msg(lib, ["default".to_string()].to_vec()).await);
  //   let bytes = msg.write_to_bytes().unwrap();
  //   let packet = ws::Message::Binary(bytes);
  //   return Some(packet);
  // }

  None
}

async fn handle_socket(mut socket: WebSocket) {
  println!("Socket connected");

  // send system info
  let mut sys_msg = library::Message::new();
  sys_msg.set_system(tokyo_library::Library::sysinfo().into());
  let _ = socket
    .send(ws::Message::Binary(sys_msg.write_to_bytes().unwrap()))
    .await;

  let (sender, mut receiver) = socket.split();

  let sender = Arc::new(Mutex::new(sender));
  let db = Arc::new(Mutex::new(Library::new().await));

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
      let ws = sender.clone();

      let db = db.clone();

      tokio::spawn(async move {
        let message = handle_socket_message(ok_msg, db)
          .await
          .expect("Error handling message");
        ws.lock()
          .await
          .send(message)
          .await
          .expect("Error sending message")
      });
    } else {
      let mut error_message = library::Message::new();
      error_message.error = Some(true);
      error_message.message = Some("Something went wrong".to_string());

      if sender
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
