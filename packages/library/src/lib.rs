mod db;
mod edit;
mod filesystem;
mod image;
mod library;
mod messages;
mod ws;

use crate::library::Library;
use serde::{Deserialize, Serialize};
use tokyo_schema::schema;

pub use messages::handle_client_request;
pub use ws::start_websocket_server;

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

impl Into<schema::MetadataEntryMessage> for MetadataEntry {
  fn into(self) -> schema::MetadataEntryMessage {
    let mut _msg = schema::MetadataEntryMessage::new();
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

pub async fn cached_thumb(file: &String) -> Vec<u8> {
  image::cached_thumb(file).await
}
