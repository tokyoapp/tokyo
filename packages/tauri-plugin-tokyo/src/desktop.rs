use std::path::Path;

use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};
use tokyo_shadow::MyImage;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<Library<R>> {
  Ok(Library(app.clone()))
}

/// Access to the library APIs.
pub struct Library<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Library<R> {
  pub async fn get_thumbnail(&self, id: String) -> crate::Result<Vec<u8>> {
    let root = tokyo_db::Root::new();
    let meta = tokyo_files::Library::metadata(&root, &id).await;
    if let Some(metadata) = meta {
      return Ok(metadata.thumbnail);
    }
    Err(crate::Error::Unknown("thumbnail".to_string()))
  }

  pub fn get_locations(&self) -> crate::Result<Vec<tokyo_db::Location>> {
    let root = tokyo_db::Root::new();
    return Ok(root.location_list().unwrap());
  }

  pub async fn get_index(&self, name: String) -> crate::Result<Vec<tokyo_files::IndexEntry>> {
    let root = tokyo_db::Root::new();
    let dir = tokyo_files::Library::find_library(&root, name.as_str())
      .unwrap()
      .path;
    let index = tokyo_files::Library::get_index(&root, dir).await;
    return Ok(index);
  }

  pub async fn get_metadata(&self, file_path: String) -> crate::Result<tokyo_files::MetadataEntry> {
    let root = tokyo_db::Root::new();
    let meta = tokyo_files::Library::metadata(&root, &file_path).await;
    if let Some(metadata) = meta {
      return Ok(metadata);
    }
    Err(crate::Error::Unknown("metadata".to_string()))
  }

  pub async fn get_system(&self) -> crate::Result<tokyo_files::SystemInfo> {
    return Ok(tokyo_files::Library::sysinfo());
  }

  pub async fn post_location(&self, name: String, path: String) -> crate::Result<()> {
    let root = tokyo_db::Root::new();
    root
      .insert_location(&name.as_str(), &path.as_str())
      .expect("Error while inserting location");
    Ok(())
  }

  pub async fn get_image(&self, path: String) -> crate::Result<Vec<u16>> {
    let mut my_image = MyImage::new(&Path::new(&path));
    Ok(my_image.render().to_rgb16().to_vec())
  }

  pub async fn post_metadata(&self) {}
}
