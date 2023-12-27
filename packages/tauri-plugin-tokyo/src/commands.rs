use crate::{LibraryExt, Result};
use tauri::{AppHandle, Runtime};
use tokyo_library::Image;

// get local library list
// #[tauri::command]
// pub async fn get_locations<R: Runtime>(
//   app: AppHandle<R>,
// ) -> Result<Vec<tokyo_library::db::Location>> {
//   return Ok(app.library().get_locations().await?);
// }

// #[command]
// pub async fn post_location<R: Runtime>(
//   app: AppHandle<R>,
//   name: String,
//   path: String,
// ) -> Result<()> {
//   app.library().post_location(name, path).await
// }

// #[command]
// pub(crate) async fn get_thumbnail<R: Runtime>(app: AppHandle<R>, id: String) -> Result<Vec<u8>> {
//   let r = app.library().get_thumbnail(id).await;
//   return Ok(r.unwrap());
// }

// #[command]
// pub async fn get_index<R: Runtime>(
//   app: AppHandle<R>,
//   name: String,
// ) -> Result<Vec<tokyo_library::IndexEntry>> {
//   let r = app.library().get_index(name).await;
//   return Ok(r.unwrap());
// }

// #[command]
// pub async fn get_system<R: Runtime>(app: AppHandle<R>) -> Result<tokyo_library::SystemInfo> {
//   return Ok(app.library().get_system().await.unwrap());
// }

// #[command]
// pub async fn create_library() {}

// #[command]
// pub async fn get_metadata<R: Runtime>(
//   app: AppHandle<R>,
//   file: String,
// ) -> Result<tokyo_library::MetadataEntry> {
//   let r = app.library().get_metadata(file).await;
//   return Ok(r.unwrap());
// }

// #[command]
// pub async fn post_metadata() {}

// #[command]
// pub async fn get_image(path: String, exposure: f32) -> Image {
//   let img = tokyo_library::Library::render_image(path, exposure);
//   img
// }
