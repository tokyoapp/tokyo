use axum::Router;
use sysinfo::{DiskExt, NetworkExt, NetworksExt, ProcessExt, System, SystemExt};

use axum::extract::ws;
use axum::{
  extract::ws::{WebSocket, WebSocketUpgrade},
  routing::get,
};

use phl_library::db::Root;
use phl_library::image::Metadata;
use phl_library::{db, Library};
use phl_proto::library;
use phl_proto::Message;

use serde::{Deserialize, Serialize};

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

fn metadata(file: &String) -> library::Message {
  let p = file;

  let m = phl_library::image::metadat(p.to_string());

  let mut msg = library::Message::new();

  if let Some(meta) = m {
    let root = db::Root::new();
    let metadata = phl_library::image::metadat(p.to_string()).unwrap();
    let file = Library::get_file(&root, &metadata.hash);

    let mut tags: Vec<String> = Vec::new();

    let rating = file
      .clone()
      .and_then(|f| Some(f.rating))
      .or(Some(meta.rating as i32))
      .unwrap();

    if let Some(f) = file {
      tags.append(&mut f.tags.clone());
    } else {
      Library::add_file(&root, &metadata.hash, meta.rating as i32);
    }

    let mut meta_msg = library::MetadataMessage::new();
    meta_msg.create_date = meta.create_date;
    meta_msg.exif = serde_json::to_string(&meta.exif).unwrap();
    meta_msg.hash = meta.hash;
    meta_msg.height = meta.height as i32;
    meta_msg.width = meta.width as i32;
    meta_msg.make = meta.make;
    meta_msg.name = meta.name;
    meta_msg.orientation = meta.orientation as i32;
    meta_msg.rating = rating;
    meta_msg.tags = tags;
    meta_msg.thumbnail = phl_library::image::cached_thumb(&p.to_string());

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

  let mut msg = library::Message::new();
  msg.set_list(get_location_list());
  let _ = socket
    .send(ws::Message::Binary(msg.write_to_bytes().unwrap()))
    .await;

  let sys = System::new_all();
  let disk = sys.disks().first().unwrap();

  let mut sys_msg = library::Message::new();
  let mut _sys_msg = library::SystemInfo::new();
  _sys_msg.disk_name = disk.name().to_str().unwrap().to_string();
  _sys_msg.disk_size = (disk.total_space() / 1000 / 1000) as i32;
  _sys_msg.disk_available = (disk.available_space() / 1000 / 1000) as i32;
  sys_msg.set_system(_sys_msg);
  let _ = socket
    .send(ws::Message::Binary(sys_msg.write_to_bytes().unwrap()))
    .await;

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
    } else if let Ok(ok_msg) = msg {
      if ok_msg.has_create() {
        let root = Root::new();
        let create = ok_msg.create();
        let _cr = Library::create_library(&root, create.name.as_str(), create.path.as_str());

        if _cr.is_ok() {
          let mut msg = library::Message::new();
          msg.set_list(get_location_list());
          let _ = socket
            .send(ws::Message::Binary(msg.write_to_bytes().unwrap()))
            .await;
        }
      }

      if ok_msg.has_index() {
        let index = ok_msg.index();
        println!("Requested Index {}", index.name);

        let mut msg = library::Message::new();
        msg.id = ok_msg.id;
        msg.set_index(get_index_msg(index.name.as_str()));
        let bytes = msg.write_to_bytes().unwrap();
        let _ = socket.send(ws::Message::Binary(bytes)).await;
      }

      if ok_msg.has_meta() {
        let file = &ok_msg.meta().file;
        let mut msg = metadata(file);
        msg.id = ok_msg.id;
        let bytes = msg.write_to_bytes().unwrap();
        let _ = socket.send(ws::Message::Binary(bytes)).await;
      }

      if ok_msg.has_image() {
        let file = &ok_msg.image().file;
        let image = phl_library::image::cached_thumb(file);
        let mut img_msg = library::ImageMessage::new();
        img_msg.image = image;
        let mut msg = library::Message::new();
        msg.id = ok_msg.id;
        msg.set_image(img_msg);
        let bytes = msg.write_to_bytes().unwrap();
        let _ = socket.send(ws::Message::Binary(bytes)).await;
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
        let _ = socket.send(ws::Message::Binary(bytes)).await;
      }
    }

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
