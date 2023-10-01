use phl_library::db;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<Library<R>> {
  Ok(Library(app.clone()))
}

/// Access to the library APIs.
pub struct Library<R: Runtime>(AppHandle<R>);

// These structs should implement into for the ProtoMessages.
//  Also they should be owned by the phl_lib
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct IndexEntry {
  pub hash: String,
  pub name: String,
  pub path: String,
  pub create_date: String,
  pub rating: i32,
  pub orientation: i32,
  pub tags: ::std::vec::Vec<String>,
}

// These structs should implement into for the ProtoMessages.
//  Also they should be owned by the phl_lib
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MetadataEntry {
  pub create_date: String,
  pub exif: String,
  pub hash: String,
  pub height: i32,
  pub width: i32,
  pub make: String,
  pub name: String,
  pub orientation: i32,
  pub rating: i32,
  pub tags: Vec<String>,
  pub thumbnail: Vec<u8>,
}

impl<R: Runtime> Library<R> {
  pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
    Ok(PingResponse {
      value: payload.value,
    })
  }

  pub fn get_locations(&self) -> crate::Result<Vec<phl_library::db::Location>> {
    let root = db::Root::new();
    return Ok(root.location_list().unwrap());
  }

  pub async fn get_index(&self, name: String) -> crate::Result<Vec<IndexEntry>> {
    let root = db::Root::new();
    let dir = phl_library::Library::find_library(&root, name.as_str())
      .unwrap()
      .path;
    let list = phl_library::Library::list(dir);

    let mut index: Vec<phl_library::image::Metadata> = Vec::new();

    for path in list {
      let meta = phl_library::image::metadat(&path);
      let _ = meta.is_some_and(|v| {
        index.push(v);
        true
      });
    }

    let result = index
      .iter()
      .map(|meta| {
        let file = phl_library::Library::get_file(&root, &meta.hash);
        let rating = file
          .clone()
          .and_then(|f| Some(f.rating))
          .or(Some(meta.rating as i32))
          .unwrap();

        IndexEntry {
          name: meta.name.clone(),
          create_date: meta.create_date.clone(),
          hash: meta.hash.clone(),
          orientation: meta.orientation as i32,
          path: meta.path.clone(),
          rating: rating,
          tags: file
            .and_then(|f| Some(f.tags))
            .or(Some(Vec::new()))
            .unwrap(),
        }
      })
      .collect();

    return Ok(result);
  }

  pub async fn get_system(&self) -> crate::Result<phl_library::SystemInfo> {
    return Ok(phl_library::Library::sysinfo());
  }

  pub async fn create_library(&self) {}

  pub async fn get_metadata(&self, file_path: String) -> crate::Result<MetadataEntry> {
    let metadata = phl_library::image::metadat(&file_path).unwrap();

    let root = db::Root::new();
    let file = phl_library::Library::get_file(&root, &metadata.hash);

    let mut tags: Vec<String> = Vec::new();

    let rating = file
      .clone()
      .and_then(|f| Some(f.rating))
      .or(Some(metadata.rating as i32))
      .unwrap();

    if let Some(f) = file {
      tags.append(&mut f.tags.clone());
    } else {
      phl_library::Library::add_file(&root, &metadata.hash, metadata.rating as i32).await;
    }

    Ok(MetadataEntry {
      create_date: metadata.create_date,
      exif: serde_json::to_string(&metadata.exif).unwrap(),
      hash: metadata.hash,
      height: metadata.height as i32,
      width: metadata.width as i32,
      make: metadata.make,
      name: metadata.name,
      orientation: metadata.orientation as i32,
      rating,
      tags,
      thumbnail: phl_library::image::cached_thumb(&file_path.clone()).await,
    })
  }

  pub async fn get_image(&self) {}

  pub async fn post_metadata(&self) {}
}
