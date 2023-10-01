use tauri::{command, AppHandle, Runtime, State, Window};

use crate::{
  desktop::{IndexEntry, MetadataEntry},
  LibraryExt, MyState, Result,
};

// #[command]
// pub(crate) async fn execute<R: Runtime>(
//   _app: AppHandle<R>,
//   _window: Window<R>,
//   state: State<'_, MyState>,
// ) -> Result<String> {

//   state.0.lock().unwrap().insert("key".into(), "value".into());
//   Ok("success".to_string())
// }

use phl_library::db;

// get local library list
#[command]
pub(crate) async fn get_list<R: Runtime>(app: AppHandle<R>) -> Result<Vec<db::Location>> {
  return Ok(app.library().get_locations().unwrap());
}

#[command]
pub async fn get_index<R: Runtime>(app: AppHandle<R>, name: String) -> Result<Vec<IndexEntry>> {
  return Ok(app.library().get_index(name).await.unwrap());
}

#[command]
pub async fn get_system<R: Runtime>(app: AppHandle<R>) -> Result<phl_library::SystemInfo> {
  return Ok(app.library().get_system().await.unwrap());
}

#[command]
pub async fn create_library() {}

#[command]
pub async fn get_metadata<R: Runtime>(app: AppHandle<R>, file: String) -> Result<MetadataEntry> {
  return Ok(app.library().get_metadata(file).await.unwrap());
}

#[command]
pub async fn get_image() {}

#[command]
pub async fn post_metadata() {}
