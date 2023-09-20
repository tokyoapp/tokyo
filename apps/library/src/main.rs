use std::sync::{Arc, Mutex};

use axum::extract::ws;
use axum::response::Response;
use axum::{
  extract::{
    ws::{WebSocket, WebSocketUpgrade},
    Query,
  },
  http::HeaderMap,
  response::IntoResponse,
  routing::get,
  Json, Router,
};

use phl_library::image::Metadata;
use phl_library::{db, Library};
use phl_proto::library;
use phl_proto::Message;

use serde::{Deserialize, Serialize};
use urlencoding::decode;

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

  let router = Router::new()
    .route(
      "/ws",
      get(|ws: WebSocketUpgrade| async { ws.on_upgrade(move |socket| handle_socket(socket)) }),
    )
    .route("/api/local/metadata", get(metadata))
    .route("/api/local/thumbnail", get(thumbnail))
    .route(
      "/api/proto",
      get(|| async {
        let list = library_list().await;
        let mut headers = HeaderMap::new();
        headers.insert("Access-Control-Allow-Origin", "*".parse().unwrap());
        (headers, list)
      }),
    );

  println!("Running app on http://127.0.0.1:8000");

  axum::Server::bind(&"127.0.0.1:8000".parse().unwrap())
    .serve(router.into_make_service())
    .await
    .unwrap();
}

async fn metadata(info: Query<FileInfo>) -> impl IntoResponse {
  let p = decode(&info.file).expect("UTF-8");
  let m = phl_library::image::metadat(p.to_string());

  let mut headers = HeaderMap::new();
  headers.insert("Access-Control-Allow-Origin", "*".parse().unwrap());
  (headers, Json(m))
}

async fn thumbnail(info: Query<FileInfo>) -> impl IntoResponse {
  let p = decode(&info.file).expect("UTF-8");

  let mut headers = HeaderMap::new();
  headers.insert("Access-Control-Allow-Origin", "*".parse().unwrap());
  headers.insert("Content-Type", "image/jpeg".parse().unwrap());
  (headers, phl_library::image::cached_thumb(p.to_string()))
}

async fn library_list() -> Vec<u8> {
  let root = db::Root::new();
  let _ = Library::create_root_library(&root).await;

  let mut msg = library::Message::new();
  let list_msg = get_location_list();

  msg.set_list(list_msg);

  // let mut headers = HeaderMap::new();
  // headers.insert("Access-Control-Allow-Origin", "*".parse().unwrap());
  msg.write_to_bytes().unwrap()
}

fn get_location_list() -> library::LibraryListMessage {
  let root = db::Root::new();
  let list = root.location_list().unwrap();
  let mut list_msg = library::LibraryListMessage::new();
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
    let meta = phl_library::image::metadat(path);
    let _ = meta.is_some_and(|v| {
      index.push(v);
      true
    });
  }

  let mut index_msg = library::LibraryIndexMessage::new();
  index_msg.index = index
    .iter()
    .map(|meta| {
      let mut msg = library::IndexEntryMessage::new();
      msg.name = meta.name.clone();
      msg.create_date = meta.create_date.clone();
      msg.hash = meta.hash.clone();
      msg.orientation = meta.orientation as i32;
      msg.path = meta.path.clone();
      msg.rating = meta.rating as i32;
      msg
    })
    .collect();

  return index_msg;
}

async fn handle_socket(mut socket: WebSocket) {
  while let Some(msg) = socket.recv().await {
    let msg = if let Ok(msg) = msg {
      msg
    } else {
      // client disconnected
      return;
    };

    let data = msg.into_data();
    let msg = library::ClientMessage::parse_from_bytes(&data);

    println!("Rec socket message {:?}", msg);

    if msg.is_err() {
      let mut error_message = library::Message::new();
      error_message.error = Some(true);
      error_message.message = Some("Something went wrong".to_string());

      if socket
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

    let ok_msg = msg.unwrap();
    if ok_msg.has_index() {
      let index = ok_msg.index();
      println!("Requested Index {}", index.name);

      let mut msg = library::Message::new();
      msg.set_index(get_index_msg(index.name.as_str()));
      let bytes = msg.write_to_bytes().unwrap();
      let _ = socket.send(ws::Message::Binary(bytes)).await;
    }

    // let mut library = Library::new();
    // if ok_msg.has_create() {
    //   let create = ok_msg.create();
    //   let _cr = library
    //     .create_library(create.name.as_str(), create.path.as_str())
    //     .await;
    //   if _cr.is_ok() {
    //     let mut msg = library::Message::new();
    //     msg.set_list(get_location_list());
    //   }
    // }

    // send message:
    if socket
      .send(ws::Message::Binary(data.clone()))
      .await
      .is_err()
    {
      // client disconnected
      return;
    }
  }
}
