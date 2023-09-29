use tauri::{command, ipc::Channel, AppHandle, Runtime, Window};

use phl_library::{db, image::Metadata, Library};
use serde::{Deserialize, Serialize};

// get local library list
#[command]
pub async fn list() -> Vec<db::Location> {
  let root = db::Root::new();
  return root.location_list().unwrap();
}

#[derive(Deserialize)]
pub struct IndexEntry {
  pub hash: String,
  pub name: String,
  pub path: String,
  pub create_date: String,
  pub rating: i32,
  pub orientation: i32,
  pub tags: ::std::vec::Vec<String>,
}

// #[command]
// pub async fn get_index(name: String) -> Vec<IndexEntry> {
//   let root = db::Root::new();
//   let dir = Library::find_library(&root, name.as_str()).unwrap().path;
//   let list = Library::list(dir);

//   let mut index: Vec<Metadata> = Vec::new();

//   for path in list {
//     let meta = phl_library::image::metadat(path);
//     let _ = meta.is_some_and(|v| {
//       index.push(v);
//       true
//     });
//   }

//   let result = index
//     .iter()
//     .map(|meta| {
//       let file = Library::get_file(&root, &meta.hash);
//       let rating = file
//         .clone()
//         .and_then(|f| Some(f.rating))
//         .or(Some(meta.rating as i32))
//         .unwrap();

//       IndexEntry {
//         name: meta.name.clone(),
//         create_date: meta.create_date.clone(),
//         hash: meta.hash.clone(),
//         orientation: meta.orientation as i32,
//         path: meta.path.clone(),
//         rating: rating,
//         tags: file
//           .and_then(|f| Some(f.tags))
//           .or(Some(Vec::new()))
//           .unwrap(),
//       }
//     })
//     .collect();

//   return result;
// }

#[command]
pub async fn get_system() {}

#[command]
pub async fn create_library() {}

#[command]
pub async fn get_metadata() {}

#[command]
pub async fn get_image() {}

#[command]
pub async fn post_metadata() {}
