#[cfg(feature = "protoc")]
mod gen;

#[cfg(feature = "protoc")]
pub use gen::library;

pub use protobuf::Message;

#[cfg(feature = "protoc")]
impl Into<library::SystemInfo> for tokyo_files::SystemInfo {
  fn into(self) -> library::SystemInfo {
    let mut _msg = library::SystemInfo::new();
    _msg.disk_name = self.disk_name;
    _msg.disk_size = self.disk_size;
    _msg.disk_available = self.disk_available;
    _msg
  }
}

#[cfg(feature = "protoc")]
impl Into<library::IndexEntryMessage> for tokyo_files::IndexEntry {
  fn into(self) -> library::IndexEntryMessage {
    let mut _msg = library::IndexEntryMessage::new();
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

#[cfg(feature = "protoc")]
impl Into<library::MetadataMessage> for tokyo_files::MetadataEntry {
  fn into(self) -> library::MetadataMessage {
    let mut _msg = library::MetadataMessage::new();
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
