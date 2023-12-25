use std::path::Path;

use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};
use tokyo_db::{Client, Root};
use tokyo_shadow::MyImage;

pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  _api: PluginApi<R, C>,
) -> crate::Result<Library<R>> {
  tokio::spawn(async move {
    let client = Root::client().await;
    Root::init_db(&client).await.expect("Error at init db");
  });

  Ok(Library(app.clone()))
}

/// Access to the library APIs.
pub struct Library<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Library<R> {
  pub async fn get_thumbnail(&self, client: &Client, id: String) -> crate::Result<Vec<u8>> {
    let meta = tokyo_files::Library::metadata(client, &id).await;
    if let Some(metadata) = meta {
      return Ok(metadata.thumbnail);
    }
    Err(crate::Error::Unknown("thumbnail".to_string()))
  }

  pub async fn get_locations(&self, client: &Client) -> crate::Result<Vec<tokyo_db::Location>> {
    return Ok(Root::location_list(client).await.unwrap());
  }

  pub async fn get_index(
    &self,
    client: &Client,
    name: String,
  ) -> crate::Result<Vec<tokyo_files::IndexEntry>> {
    let dir = tokyo_files::Library::find_library(client, name.as_str())
      .await
      .unwrap()
      .path;
    let index = tokyo_files::Library::get_index(client, dir).await;
    return Ok(index);
  }

  pub async fn get_metadata(
    &self,
    client: &Client,
    file_path: String,
  ) -> crate::Result<tokyo_files::MetadataEntry> {
    let meta = tokyo_files::Library::metadata(client, &file_path).await;
    if let Some(metadata) = meta {
      return Ok(metadata);
    }
    Err(crate::Error::Unknown("metadata".to_string()))
  }

  pub async fn get_system(&self) -> crate::Result<tokyo_files::SystemInfo> {
    return Ok(tokyo_files::Library::sysinfo());
  }

  pub async fn post_location(
    &self,
    client: &Client,
    name: String,
    path: String,
  ) -> crate::Result<()> {
    Root::insert_location(client, &name.as_str(), &path.as_str())
      .await
      .expect("Error while inserting location");
    Ok(())
  }

  pub async fn get_image(&self, path: String) -> crate::Result<Vec<u16>> {
    let mut my_image = MyImage::new(&Path::new(&path));
    Ok(my_image.render().to_rgb16().to_vec())
  }

  pub async fn post_metadata(&self) {}
}
