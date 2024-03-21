use crate::db;
use crate::filesystem;
use crate::image;
use crate::IndexEntry;
use crate::MetadataEntry;
use crate::SystemInfo;

use anyhow::Result;
use futures::future::join_all;
use log::error;
use std::borrow::Borrow;
use std::sync::Arc;
use sysinfo::DiskExt;
use sysinfo::SystemExt;
use tokio::sync::Mutex;

pub struct Library {
  db: db::LibraryDatabase,
}

unsafe impl Sync for db::LibraryDatabase {}
unsafe impl Send for db::LibraryDatabase {}

impl Library {
  pub async fn new() -> Library {
    Library {
      db: db::LibraryDatabase::new().await,
    }
  }

  // pub fn render_image(path: String, exposure: f32) -> Image {
  //   let mut img = edit::EditedImage::new(
  //     &Path::new(&path),
  //     tokyo_shadow::Edits {
  //       gamma: 2.4,
  //       exposure,
  //       curve: vec![(0.00, 0.00), (1.0, 1.0)],
  //     },
  //   );
  //   let resized = img.render().resize(1024, 1024, FilterType::Lanczos3);

  //   Image {
  //     width: resized.width(),
  //     height: resized.height(),
  //     data: resized.to_rgb8().to_vec(),
  //   }
  // }

  pub async fn init(&self) {
    self.db.borrow().init_db().await.unwrap();
  }

  pub fn list(dir: String) -> Vec<String> {
    return filesystem::list(dir);
  }

  pub async fn metadata(&self, p: String) -> Option<MetadataEntry> {
    let meta = image::metadat(&p.to_string());

    if let Ok(metadata) = meta {
      let file = self.get_file(metadata.hash.clone()).await;

      let mut tags: Vec<String> = Vec::new();

      let rating = file
        .clone()
        .and_then(|f| Some(f.rating))
        .or(Some(metadata.rating as i32))
        .unwrap();

      if let Some(f) = file {
        tags.append(&mut f.tags.clone());
      } else {
        self
          .add_file(metadata.hash.clone(), metadata.rating as i32)
          .await;
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

  pub async fn get_index(&self, dir: String) -> Result<Vec<IndexEntry>> {
    let list = Library::list(dir);
    let mut index: Vec<image::Metadata> = Vec::new();

    for path in list {
      let meta = image::metadat(&path);
      if let Ok(meta) = meta {
        index.push(meta);
      } else {
        error!("Failed to get metadata for {}", path);
      }
    }

    let lib = Arc::new(Mutex::new(self));

    let idx = index.iter().map(|meta| async {
      let lib = lib.clone();

      let file = lib.lock().await.borrow().get_file(meta.hash.clone()).await;
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

    Ok(join_all(idx).await)
  }

  pub async fn get_index_ccapi(&self, dir: String) -> Result<Vec<IndexEntry>> {
    Err(anyhow::anyhow!("Not implemented"))
  }

  pub async fn add_file(&self, hash: String, rating: i32) {
    let id = self.db.insert_tag("Test").await.unwrap();

    let _ = self
      .db
      .insert_file(&hash, rating)
      .await
      .expect("Failed to insert file");

    let mut f = self.db.get_file(&hash).await.unwrap();
    let tags = &mut f.first_mut().unwrap().tags;

    tags.push(id);

    let _ = self.db.set_tags(&hash, tags.as_ref()).await;
  }

  pub async fn get_file(&self, hash: String) -> Option<db::schema::File> {
    return self
      .db
      .get_file(&hash)
      .await
      .expect("Failed to get file")
      .first()
      .and_then(|f| Some(f.clone()));
  }

  pub async fn list_tags(&self) -> Vec<db::schema::Tag> {
    self.db.tags_list().await.unwrap()
  }

  pub async fn list_locations(&self) -> Result<Vec<db::schema::Location>> {
    Ok(self.db.location_list().await?)
  }

  pub async fn set_rating(&self, file: String, rating: i32) -> Result<()> {
    self.db.set_rating(&file, rating).await?;
    Ok(())
  }

  pub async fn find_library(&self, id: String) -> Result<db::schema::Location> {
    let locs = self.db.location_list().await?;
    let loc = locs
      .iter()
      .find(|lib| lib.id == id.clone())
      .expect("Could not find library");

    return Ok(loc.clone());
  }

  pub async fn create_library(&self, name: String, path: String) -> Result<()> {
    self.db.insert_location(&name, &path).await?;
    Ok(())
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
