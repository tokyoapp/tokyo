pub mod image;

mod edit;
mod images;

use anyhow::Result;

use std::path::Path;

use ::image::imageops::FilterType;
use sysinfo::DiskExt;
use sysinfo::SystemExt;

use futures::future::join_all;

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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Image {
  pub height: u32,
  pub width: u32,
  pub data: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Edits {
  pub exposure: u32,
}

pub struct Library {}

impl Library {
  pub fn render_image(path: String, exposure: f32) -> Image {
    let mut img = edit::EditedImage::new(
      &Path::new(&path),
      tokyo_shadow::Edits {
        gamma: 2.4,
        exposure,
        curve: vec![(0.00, 0.00), (1.0, 1.0)],
      },
    );
    let resized = img.render().resize(1024, 1024, FilterType::Lanczos3);

    Image {
      width: resized.width(),
      height: resized.height(),
      data: resized.to_rgb8().to_vec(),
    }
  }

  pub fn list(dir: String) -> Vec<String> {
    return images::list(dir);
  }

  pub async fn list_tags(root: &tokyo_db::Root) -> Vec<tokyo_db::Tag> {
    root.tags_list().await.unwrap()
  }

  pub async fn default_library(root: &tokyo_db::Root) -> Option<tokyo_db::Location> {
    let locs = root
      .location_list()
      .await
      .expect("Failed to list locations");
    let first = locs.first();

    if let Some(location) = first {
      return Some(location.clone());
    }
    None
  }

  pub async fn metadata(root: &tokyo_db::Root, p: &String) -> Option<MetadataEntry> {
    let meta = image::metadat(&p.to_string());

    if let Some(metadata) = meta {
      let file = Library::get_file(&root, &metadata.hash).await;

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

  pub async fn get_index(root: &tokyo_db::Root, dir: String) -> Vec<IndexEntry> {
    let list = Library::list(dir);
    let mut index: Vec<image::Metadata> = Vec::new();

    for path in list {
      let meta = image::metadat(&path);
      let _ = meta.is_some_and(|v| {
        index.push(v);
        true
      });
    }

    let idx = index.iter().map(|meta| async {
      let file = Library::get_file(&root, &meta.hash).await;
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
    });

    join_all(idx).await
  }

  pub async fn add_file(root: &tokyo_db::Root, hash: &str, rating: i32) {
    let id = root.insert_tag("Test").await.unwrap();

    let _ = root
      .insert_file(hash, rating)
      .await
      .expect("Failed to insert file");

    let mut f = root.get_file(hash).await.unwrap();
    let tags = &mut f.first_mut().unwrap().tags;

    tags.push(id);

    let _ = root.set_tags(hash, tags.as_ref()).await;
  }

  pub async fn get_file(root: &tokyo_db::Root, hash: &str) -> Option<tokyo_db::File> {
    return root
      .get_file(hash)
      .await
      .expect("Failed to get file")
      .first()
      .and_then(|f| Some(f.clone()));
  }

  pub async fn find_library(root: &tokyo_db::Root, id: &str) -> Result<tokyo_db::Location> {
    let locs = root.location_list().await?;
    let loc = locs
      .iter()
      .find(|lib| lib.id == id)
      .expect("Could not find library");

    return Ok(loc.clone());
  }

  pub async fn create_library(root: &tokyo_db::Root, name: &str, path: &str) -> Result<()> {
    root.insert_location(name, path).await?;
    Ok(())
  }

  pub async fn create_root_library(root: &tokyo_db::Root) -> Result<()> {
    let list = root.location_list().await?;
    if list.len() == 0 {
      root
        .insert_location("default", "/Users/tihav/Pictures")
        .await?;
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
