use crate::cached_thumb;
use crate::IndexEntry;
use crate::Library;
use axum::extract::ws;
use axum::extract::ws::WebSocket;
use futures::sink::SinkExt;
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokyo_proto::schema::{self, ClientMessage, IndexEntryMessage};
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

async fn metadata(lib: &Library, file: &String) -> schema::Message {
  let meta = lib.metadata(file.clone()).await;
  let mut msg = schema::Message::new();
  if let Some(metadata) = meta {
    msg.set_metadata(metadata.into());
  }
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
    println!("{}", id);
    let dir = lib.find_library(id).await.unwrap().path;
    let mut index = lib.get_index(dir).await;
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

async fn handle_socket_message(ok_msg: ClientMessage) -> Option<ws::Message> {
  let lib = &Library::new().await;

  if ok_msg.has_locations() {
    let mut msg = schema::Message::new();
    msg.id = ok_msg.id;
    msg.set_list(get_location_list(lib).await);
    let packet = ws::Message::Binary(msg.write_to_bytes().unwrap());
    return Some(packet);
  }

  if ok_msg.has_index() {
    let index = ok_msg.index();
    println!("Requested Index {:?}", index);
    let mut msg = schema::Message::new();
    msg.id = ok_msg.id;
    msg.set_index(get_index_msg(lib, index.ids.clone()).await);
    let bytes = msg.write_to_bytes().unwrap();
    let packet = ws::Message::Binary(bytes);
    return Some(packet);
  }

  if ok_msg.has_create() {
    let create = ok_msg.create();
    let _cr = lib
      .create_library(create.name.to_string(), create.path.to_string())
      .await;

    if _cr.is_ok() {
      let mut msg = schema::Message::new();
      msg.set_list(get_location_list(lib).await);
      let bytes = msg.write_to_bytes().unwrap();
      let packet = ws::Message::Binary(bytes);
      return Some(packet);
    }
  }

  if ok_msg.has_meta() {
    let file = &ok_msg.meta().file;
    let mut msg = metadata(lib, file).await;
    msg.id = ok_msg.id;
    let bytes = msg.write_to_bytes().unwrap();
    let packet = ws::Message::Binary(bytes);
    return Some(packet);
  }

  if ok_msg.has_image() {
    let file = &ok_msg.image().file; // should be the hash,
    let image = cached_thumb(file).await; // then this doesnt need to look for the hash itself
    let mut img_msg = schema::ImageMessage::new();
    img_msg.image = image;
    let mut msg = schema::Message::new();
    msg.id = ok_msg.id;
    msg.set_image(img_msg);
    let bytes = msg.write_to_bytes().unwrap();
    let packet = ws::Message::Binary(bytes);
    return Some(packet);
  }

  if ok_msg.has_postmeta() {
    let file = &ok_msg.postmeta().file;
    let rating = ok_msg.postmeta().rating.unwrap();
    lib.set_rating(file.clone(), rating).await;

    let mut msg = schema::Message::new();
    msg.id = ok_msg.id;
    msg.set_index(get_index_msg(lib, ["default".to_string()].to_vec()).await);
    let bytes = msg.write_to_bytes().unwrap();
    let packet = ws::Message::Binary(bytes);
    return Some(packet);
  }

  None
}

pub async fn handle_socket(mut socket: WebSocket) {
  println!("Socket connected");

  // send system info
  let mut sys_msg = schema::Message::new();
  sys_msg.set_system(Library::sysinfo().into());
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
    let msg = schema::ClientMessage::parse_from_bytes(&data);

    if let Ok(ok_msg) = msg {
      let ws = sender.clone();
      let db = db.clone();

      tokio::spawn(async move {
        let lib = &Library::new().await;
        lib.init().await;

        // let message = handle_socket_message(ok_msg)
        //   .await
        //   .expect("Error handling message");

        // ws.lock()
        //   .await
        //   .send(message)
        //   .await
        //   .expect("Error sending message")
      });
    } else {
      let mut error_message = schema::Message::new();
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
