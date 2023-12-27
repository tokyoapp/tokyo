use serde::de::DeserializeOwned;
use std::{path::Path, sync::Arc};
use tauri::{plugin::PluginApi, AppHandle, Runtime};
use tokio::sync::Mutex;
use tokyo_shadow::MyImage;

use crate::LibraryExt;

pub async fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<Library<R>> {
  // tokio::spawn(async move {
  //   let db = Database::new().await;
  //   db.init_db().await.expect("Error at init db");
  // });

  let lib = Library::new(app.clone()).await;
  Ok(lib)
}

/// Access to the library APIs.
pub struct Library<R: Runtime> {
  app: AppHandle<R>,
}

impl<R: Runtime> Library<R> {
  pub async fn new(handle: AppHandle<R>) -> Library<R> {
    Library { app: handle }
  }

  // pub async fn get_thumbnail(&self, id: String) -> crate::Result<Vec<u8>> {
  //   let meta = tokyo_library::Library::metadata(&self.db, &id).await;
  //   if let Some(metadata) = meta {
  //     return Ok(metadata.thumbnail);
  //   }
  //   Err(crate::Error::Unknown("thumbnail".to_string()))
  // }

  // pub async fn get_locations(&self) -> crate::Result<Vec<tokyo_library::db::Location>> {
  //   let db = Database::new().await;
  //   let d = db.location_list().await.unwrap();
  //   return Ok(d);
  // }

  // pub async fn post_location(&self, name: String, path: String) -> crate::Result<()> {
  //   Database::insert_location(&name.as_str(), &path.as_str())
  //     .await
  //     .expect("Error while inserting location");
  //   Ok(())
  // }

  // pub async fn get_index(&self, name: String) -> crate::Result<Vec<tokyo_library::IndexEntry>> {
  //   let dir = tokyo_library::Library::find_library(&self.db, name.as_str())
  //     .await
  //     .unwrap()
  //     .path;
  //   let index = tokyo_library::Library::get_index(&self.db, dir).await;
  //   return Ok(index);
  // }

  // pub async fn get_metadata(
  //   &self,
  //   file_path: String,
  // ) -> crate::Result<tokyo_library::MetadataEntry> {
  //   let meta = tokyo_library::Library::metadata(&self.db, &file_path).await;
  //   if let Some(metadata) = meta {
  //     return Ok(metadata);
  //   }
  //   Err(crate::Error::Unknown("metadata".to_string()))
  // }

  // pub async fn get_system(&self) -> crate::Result<tokyo_library::SystemInfo> {
  //   return Ok(tokyo_library::Library::sysinfo());
  // }

  // pub async fn get_image(&self, path: String) -> crate::Result<Vec<u16>> {
  //   let mut my_image = MyImage::new(&Path::new(&path));
  //   Ok(my_image.render().to_rgb16().to_vec())
  // }

  // pub async fn post_metadata(&self) {}
}
