mod db;
mod edit;
mod image;
mod images;
mod ws;

use ::image::imageops::FilterType;
use anyhow::Result;
use axum::extract::WebSocketUpgrade;
use axum::routing::get;
use axum::Router;
use db::LibraryDatabase;
use futures::future::join_all;
use serde::{Deserialize, Serialize};
use std::borrow::Borrow;
use std::path::Path;
use std::sync::Arc;
use sysinfo::DiskExt;
use sysinfo::SystemExt;
use tokio::sync::Mutex;
use tokyo_proto::schema;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SystemInfo {
  pub disk_name: String,
  pub disk_size: i32,
  pub disk_available: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct IndexEntry {
  pub hash: String,
  pub name: String,
  pub path: String,
  pub create_date: String,
  pub rating: i32,
  pub orientation: i32,
  pub tags: ::std::vec::Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MetadataEntry {
  pub create_date: String,
  pub exif: String,
  pub hash: String,
  pub height: i32,
  pub width: i32,
  pub make: String,
  pub name: String,
  pub orientation: i32,
  pub rating: i32,
  pub tags: Vec<String>,
  pub thumbnail: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Image {
  pub height: u32,
  pub width: u32,
  pub data: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Edits {
  pub exposure: u32,
}

impl Into<schema::SystemInfo> for SystemInfo {
  fn into(self) -> schema::SystemInfo {
    let mut _msg = schema::SystemInfo::new();
    _msg.disk_name = self.disk_name;
    _msg.disk_size = self.disk_size;
    _msg.disk_available = self.disk_available;
    _msg
  }
}

impl Into<schema::IndexEntryMessage> for IndexEntry {
  fn into(self) -> schema::IndexEntryMessage {
    let mut _msg = schema::IndexEntryMessage::new();
    _msg.hash = self.hash;
    _msg.name = self.name;
    _msg.path = self.path;
    _msg.create_date = self.create_date;
    _msg.rating = self.rating;
    _msg.orientation = self.orientation;
    _msg.tags = self.tags;
    _msg
  }
}

impl Into<schema::MetadataMessage> for MetadataEntry {
  fn into(self) -> schema::MetadataMessage {
    let mut _msg = schema::MetadataMessage::new();
    _msg.hash = self.hash;
    _msg.name = self.name;
    _msg.create_date = self.create_date;
    _msg.rating = self.rating;
    _msg.width = self.width;
    _msg.height = self.height;
    _msg.make = self.make;
    _msg.exif = self.exif;
    _msg.orientation = self.orientation;
    _msg.thumbnail = self.thumbnail;
    _msg.tags = self.tags;
    _msg
  }
}

pub struct Library {
  db: LibraryDatabase,
}

unsafe impl Sync for LibraryDatabase {}
unsafe impl Send for LibraryDatabase {}

impl Library {
  pub async fn new() -> Library {
    Library {
      db: LibraryDatabase::new().await,
    }
  }

  // pub fn render_image(path: String, exposure: f32) -> Image {
  //   let mut img = edit::EditedImage::new(
  //     &Path::new(&path),
  //     tokyo_shadow::Edits {
  //       gamma: 2.4,
  //       exposure,
  //       curve: vec![(0.00, 0.00), (1.0, 1.0)],
  //     },
  //   );
  //   let resized = img.render().resize(1024, 1024, FilterType::Lanczos3);

  //   Image {
  //     width: resized.width(),
  //     height: resized.height(),
  //     data: resized.to_rgb8().to_vec(),
  //   }
  // }

  pub async fn init(&self) {
    self.db.borrow().init_db().await.unwrap();
  }

  pub fn list(dir: String) -> Vec<String> {
    return images::list(dir);
  }

  pub async fn metadata(&self, p: String) -> Option<MetadataEntry> {
    let meta = image::metadat(&p.to_string());

    if let Some(metadata) = meta {
      let file = self.get_file(metadata.hash.clone()).await;

      let mut tags: Vec<String> = Vec::new();

      let rating = file
        .clone()
        .and_then(|f| Some(f.rating))
        .or(Some(metadata.rating as i32))
        .unwrap();

      if let Some(f) = file {
        tags.append(&mut f.tags.clone());
      } else {
        self
          .add_file(metadata.hash.clone(), metadata.rating as i32)
          .await;
      }

      let meta_data = MetadataEntry {
        create_date: metadata.create_date,
        exif: serde_json::to_string(&metadata.exif).unwrap(),
        hash: metadata.hash,
        height: metadata.height as i32,
        width: metadata.width as i32,
        make: metadata.make,
        name: metadata.name,
        orientation: metadata.orientation as i32,
        rating,
        tags,
        thumbnail: image::cached_thumb(&p.to_string()).await,
      };

      return Some(meta_data);
    }

    None
  }

  pub async fn get_index(&self, dir: String) -> Vec<IndexEntry> {
    let list = Library::list(dir);
    let mut index: Vec<image::Metadata> = Vec::new();

    for path in list {
      let meta = image::metadat(&path);
      let _ = meta.is_some_and(|v| {
        index.push(v);
        true
      });
    }

    let lib = Arc::new(Mutex::new(self));

    let idx = index.iter().map(|meta| async {
      let lib2 = lib.clone();

      let file = lib2.lock().await.borrow().get_file(meta.hash.clone()).await;
      let rating = file
        .clone()
        .and_then(|f| Some(f.rating))
        .or(Some(meta.rating as i32))
        .unwrap();

      IndexEntry {
        name: meta.name.clone(),
        create_date: meta.create_date.clone(),
        hash: meta.hash.clone(),
        orientation: meta.orientation as i32,
        path: meta.path.clone(),
        rating,
        tags: file
          .and_then(|f| Some(f.tags))
          .or(Some(Vec::new()))
          .unwrap(),
      }
    });

    join_all(idx).await
  }

  pub async fn add_file(&self, hash: String, rating: i32) {
    let id = self.db.insert_tag("Test").await.unwrap();

    let _ = self
      .db
      .insert_file(&hash, rating)
      .await
      .expect("Failed to insert file");

    let mut f = self.db.get_file(&hash).await.unwrap();
    let tags = &mut f.first_mut().unwrap().tags;

    tags.push(id);

    let _ = self.db.set_tags(&hash, tags.as_ref()).await;
  }

  pub async fn get_file(&self, hash: String) -> Option<db::File> {
    return self
      .db
      .get_file(&hash)
      .await
      .expect("Failed to get file")
      .first()
      .and_then(|f| Some(f.clone()));
  }

  pub async fn list_tags(&self) -> Vec<db::Tag> {
    self.db.tags_list().await.unwrap()
  }

  pub async fn list_locations(&self) -> Result<Vec<db::Location>> {
    Ok(self.db.location_list().await?)
  }

  pub async fn set_rating(&self, file: String, rating: i32) -> Result<()> {
    self.db.set_rating(&file, rating).await?;
    Ok(())
  }

  pub async fn find_library(&self, id: String) -> Result<db::Location> {
    let locs = self.db.location_list().await?;
    let loc = locs
      .iter()
      .find(|lib| lib.id == id.clone())
      .expect("Could not find library");

    return Ok(loc.clone());
  }

  pub async fn create_library(&self, name: String, path: String) -> Result<()> {
    self.db.insert_location(&name, &path).await?;
    Ok(())
  }

  pub fn sysinfo() -> SystemInfo {
    let sys = sysinfo::System::new_all();
    let disk = sys.disks().first().unwrap();

    SystemInfo {
      disk_name: disk.name().to_str().unwrap().to_string(),
      disk_size: (disk.total_space() / 1000 / 1000) as i32,
      disk_available: (disk.available_space() / 1000 / 1000) as i32,
    }
  }
}

pub async fn cached_thumb(file: &String) -> Vec<u8> {
  image::cached_thumb(file).await
}

pub async fn start_websocket_server() {
  Library::new().await.init().await;

  let router = Router::new().route(
    "/ws",
    get(|ws: WebSocketUpgrade| async { ws.on_upgrade(move |socket| ws::handle_socket(socket)) }),
  );

  println!("Running app on http://0.0.0.0:8000");

  axum::Server::bind(&"0.0.0.0:8000".parse().unwrap())
    .serve(router.into_make_service())
    .await
    .unwrap();
}
