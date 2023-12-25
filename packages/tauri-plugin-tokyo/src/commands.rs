use crate::{LibraryExt, Result};
use tauri::{command, AppHandle, Runtime};
use tokyo_db::Root;
use tokyo_files::Image;

// get local library list
#[command]
pub(crate) async fn get_locations<R: Runtime>(
  app: AppHandle<R>,
) -> Result<Vec<tokyo_db::Location>> {
  let lib = app.library();
  let client = Root::client().await;
  let r = lib.get_locations(&client).await;
  return Ok(r.unwrap());
}

#[command]
pub(crate) async fn get_thumbnail<R: Runtime>(app: AppHandle<R>, id: String) -> Result<Vec<u8>> {
  let lib = app.library();
  let client = Root::client().await;
  let r = app.library().get_thumbnail(&client, id).await;
  return Ok(r.unwrap());
}

#[command]
pub async fn get_index<R: Runtime>(
  app: AppHandle<R>,
  name: String,
) -> Result<Vec<tokyo_files::IndexEntry>> {
  let lib = app.library();
  let client = Root::client().await;
  let r = app.library().get_index(&client, name).await;
  return Ok(r.unwrap());
}

#[command]
pub async fn get_system<R: Runtime>(app: AppHandle<R>) -> Result<tokyo_files::SystemInfo> {
  return Ok(app.library().get_system().await.unwrap());
}

#[command]
pub async fn create_library() {}

#[command]
pub async fn get_metadata<R: Runtime>(
  app: AppHandle<R>,
  file: String,
) -> Result<tokyo_files::MetadataEntry> {
  let lib = app.library();
  let client = Root::client().await;
  let r = app.library().get_metadata(&client, file).await;
  return Ok(r.unwrap());
}

#[command]
pub async fn get_image(path: String, exposure: f32) -> Image {
  let img = tokyo_files::Library::render_image(path, exposure);
  img
}

#[command]
pub async fn post_metadata() {}

#[command]
pub async fn post_location<R: Runtime>(
  app: AppHandle<R>,
  name: String,
  path: String,
) -> Result<()> {
  let lib = app.library();
  let client = Root::client().await;
  app.library().post_location(&client, name, path).await
}
