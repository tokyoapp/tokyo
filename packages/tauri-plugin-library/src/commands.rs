use tauri::{command, AppHandle, Runtime};

use crate::{LibraryExt, Result};

use phl_library::db;

// get local library list
#[command]
pub(crate) async fn get_locations<R: Runtime>(app: AppHandle<R>) -> Result<Vec<db::Location>> {
  return Ok(app.library().get_locations().unwrap());
}

#[command]
pub(crate) async fn get_thumbnail<R: Runtime>(app: AppHandle<R>, id: String) -> Result<Vec<u8>> {
  return Ok(app.library().get_thumbnail(id).await.unwrap());
}

#[command]
pub async fn get_index<R: Runtime>(
  app: AppHandle<R>,
  name: String,
) -> Result<Vec<phl_library::IndexEntry>> {
  return Ok(app.library().get_index(name).await.unwrap());
}

#[command]
pub async fn get_system<R: Runtime>(app: AppHandle<R>) -> Result<phl_library::SystemInfo> {
  return Ok(app.library().get_system().await.unwrap());
}

#[command]
pub async fn create_library() {}

#[command]
pub async fn get_metadata<R: Runtime>(
  app: AppHandle<R>,
  file: String,
) -> Result<phl_library::MetadataEntry> {
  return Ok(app.library().get_metadata(file).await.unwrap());
}

#[command]
pub async fn get_image() {}

#[command]
pub async fn post_metadata() {}

#[command]
pub async fn post_location<R: Runtime>(
  app: AppHandle<R>,
  name: String,
  path: String,
) -> Result<()> {
  app.library().post_location(name, path).await
}
