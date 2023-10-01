use tauri::{command, AppHandle, Runtime, State, Window};

use crate::{desktop::IndexEntry, LibraryExt, MyState, Result};

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
pub async fn get_metadata<R: Runtime>(
  app: AppHandle<R>,
  file: String,
) -> Result<phl_library::image::Metadata> {
  let meta = phl_library::image::metadat(file);

  // let mut msg = library::Message::new();

  // if let Some(metadata) = meta {
  //   let root = db::Root::new();
  //   let file = Library::get_file(&root, &metadata.hash);

  //   let mut tags: Vec<String> = Vec::new();

  //   let rating = file
  //     .clone()
  //     .and_then(|f| Some(f.rating))
  //     .or(Some(metadata.rating as i32))
  //     .unwrap();

  //   if let Some(f) = file {
  //     tags.append(&mut f.tags.clone());
  //   } else {
  //     Library::add_file(&root, &metadata.hash, metadata.rating as i32).await;
  //   }

  //   let mut meta_msg = library::MetadataMessage::new();
  //   meta_msg.create_date = metadata.create_date;
  //   meta_msg.exif = serde_json::to_string(&metadata.exif).unwrap();
  //   meta_msg.hash = metadata.hash;
  //   meta_msg.height = metadata.height as i32;
  //   meta_msg.width = metadata.width as i32;
  //   meta_msg.make = metadata.make;
  //   meta_msg.name = metadata.name;
  //   meta_msg.orientation = metadata.orientation as i32;
  //   meta_msg.rating = rating;
  //   meta_msg.tags = tags;
  //   meta_msg.thumbnail = phl_library::image::cached_thumb(&file.to_string()).await;

  //   msg.set_metadata(meta_msg);
  // }

  return Ok(meta.unwrap());
}

#[command]
pub async fn get_image() {}

#[command]
pub async fn post_metadata() {}
