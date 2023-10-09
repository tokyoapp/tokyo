use phl_library::db;
use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<Library<R>> {
  Ok(Library(app.clone()))
}

/// Access to the library APIs.
pub struct Library<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Library<R> {
  pub fn get_locations(&self) -> crate::Result<Vec<phl_library::db::Location>> {
    let root = db::Root::new();
    return Ok(root.location_list().unwrap());
  }

  pub async fn get_index(&self, name: String) -> crate::Result<Vec<phl_library::IndexEntry>> {
    let root = db::Root::new();
    let dir = phl_library::Library::find_library(&root, name.as_str())
      .unwrap()
      .path;
    let index = phl_library::Library::get_index(&root, dir).await;
    return Ok(index);
  }

  pub async fn get_metadata(&self, file_path: String) -> crate::Result<phl_library::MetadataEntry> {
    let root = db::Root::new();
    let meta = phl_library::Library::metadata(&root, &file_path).await;
    if let Some(metadata) = meta {
      return Ok(metadata);
    }
    Err(crate::Error::Unknown("metadata".to_string()))
  }

  pub async fn get_system(&self) -> crate::Result<phl_library::SystemInfo> {
    return Ok(phl_library::Library::sysinfo());
  }

  pub async fn create_library(&self) {}

  pub async fn get_image(&self) {}

  pub async fn post_metadata(&self) {}
}
