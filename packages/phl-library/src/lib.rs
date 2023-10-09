pub mod image;

pub mod db;
mod images;

use serde_json::value::Index;
use sysinfo::DiskExt;
use sysinfo::SystemExt;

use db::{File, Tag};
use db::{Location, Root};
use rusqlite::Result;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SystemInfo {
  pub disk_name: String,
  pub disk_size: i32,
  pub disk_available: i32,
}

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

pub struct Library {}

impl Library {
  pub fn list(dir: String) -> Vec<String> {
    return images::list(dir);
  }

  pub fn list_tags(root: &Root) -> Vec<Tag> {
    root.tags_list().unwrap()
  }

  pub fn default_library(root: &Root) -> Option<Location> {
    let locs = root.location_list().expect("Failed to list locations");
    let first = locs.first();

    if let Some(location) = first {
      return Some(location.clone());
    }
    None
  }

  pub async fn metadata(root: &Root, p: &String) -> Option<MetadataEntry> {
    let meta = image::metadat(&p.to_string());

    if let Some(metadata) = meta {
      let file = Library::get_file(&root, &metadata.hash);

      let mut tags: Vec<String> = Vec::new();

      let rating = file
        .clone()
        .and_then(|f| Some(f.rating))
        .or(Some(metadata.rating as i32))
        .unwrap();

      if let Some(f) = file {
        tags.append(&mut f.tags.clone());
      } else {
        Library::add_file(&root, &metadata.hash, metadata.rating as i32).await;
      }

      let meta_data = MetadataEntry {
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
        thumbnail: image::cached_thumb(&p.to_string()).await,
      };

      return Some(meta_data);
    }

    None
  }

  pub async fn get_index(root: &Root, dir: String) -> Vec<IndexEntry> {
    let list = Library::list(dir);
    let mut index: Vec<image::Metadata> = Vec::new();

    for path in list {
      let meta = image::metadat(&path);
      let _ = meta.is_some_and(|v| {
        index.push(v);
        true
      });
    }

    index
      .iter()
      .map(|meta| {
        let file = Library::get_file(&root, &meta.hash);
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
          rating,
          tags: file
            .and_then(|f| Some(f.tags))
            .or(Some(Vec::new()))
            .unwrap(),
        }
      })
      .collect()
  }

  pub async fn add_file(root: &Root, hash: &str, rating: i32) {
    let id = root.insert_tag("Test").await.unwrap();

    let _ = root
      .insert_file(hash, rating)
      .expect("Failed to insert file");

    let mut f = root.get_file(hash).unwrap();
    let tags = &mut f.first_mut().unwrap().tags;

    tags.push(id);

    let _ = root.set_tags(hash, tags.as_ref());
  }

  pub fn get_file(root: &Root, hash: &str) -> Option<File> {
    return root
      .get_file(hash)
      .expect("Failed to get file")
      .first()
      .and_then(|f| Some(f.clone()));
  }

  pub fn find_library(root: &Root, name: &str) -> Result<Location> {
    let locs = root.location_list()?;
    let loc = locs
      .iter()
      .find(|lib| lib.name == name)
      .expect("Could not find library");

    return Ok(loc.clone());
  }

  pub fn create_library(root: &Root, name: &str, path: &str) -> Result<(), rusqlite::Error> {
    root.insert_location(name, path)?;
    Ok(())
  }

  pub async fn create_root_library(root: &Root) -> Result<()> {
    let list = root.location_list()?;
    if list.len() == 0 {
      root.insert_location("default", "/Users/tihav/Pictures")?;
    }

    return Ok(());
  }

  pub fn sysinfo() -> SystemInfo {
    let sys = sysinfo::System::new_all();
    let disk = sys.disks().first().unwrap();

    SystemInfo {
      disk_name: disk.name().to_str().unwrap().to_string(),
      disk_size: (disk.total_space() / 1000 / 1000) as i32,
      disk_available: (disk.available_space() / 1000 / 1000) as i32,
    }
  }
}
