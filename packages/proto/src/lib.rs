#[cfg(feature = "protoc")]
mod gen;

#[cfg(feature = "protoc")]
pub use gen::library;
pub use protobuf::Message;

#[cfg(feature = "protoc")]
impl Into<library::SystemInfo> for phl_library::SystemInfo {
  fn into(self) -> library::SystemInfo {
    let mut _sys_msg = library::SystemInfo::new();
    _sys_msg.disk_name = self.disk_name;
    _sys_msg.disk_size = self.disk_size;
    _sys_msg.disk_available = self.disk_available;
    _sys_msg
  }
}
