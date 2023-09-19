pub mod image;

mod db;
mod images;

use db::{Location, Root};
use rusqlite::Result;

pub struct Library {
  pub root: Root,
}

impl Library {
  pub fn new() -> Library {
    Library {
      root: db::Root::new(),
    }
  }

  pub fn list(self: &Self, dir: String) -> Vec<String> {
    return images::list(dir);
  }

  pub fn default_library(self: &Self) -> Option<Location> {
    let locs = self.root.location_list().expect("Failed to list locations");
    let first = locs.first();

    if let Some(location) = first {
      return Some(location.clone());
    }
    None
  }

  pub fn find_library(self: &Self, name: &str) -> Result<Location> {
    let locs = self.root.location_list()?;
    let loc = locs
      .iter()
      .find(|lib| lib.name == name)
      .expect("Could not find library");

    return Ok(loc.clone());
  }

  pub async fn create_library(self: &Self, name: &str, path: &str) -> Result<(), rusqlite::Error> {
    self.root.insert_location(name, path).await?;
    Ok(())
  }

  pub async fn create_root_library(self: &Self) -> Result<()> {
    let list = self.root.location_list()?;
    if list.len() == 0 {
      self
        .root
        .insert_location("default", "/Users/tihav/Pictures")
        .await?;
    }

    return Ok(());
  }
}
