pub mod image;

pub mod db;
mod images;

use db::{Location, Root};
use rusqlite::Result;

pub struct Library {}

impl Library {
  pub fn list(dir: String) -> Vec<String> {
    return images::list(dir);
  }

  pub fn default_library(root: &Root) -> Option<Location> {
    let locs = root.location_list().expect("Failed to list locations");
    let first = locs.first();

    if let Some(location) = first {
      return Some(location.clone());
    }
    None
  }

  pub fn find_library(root: &Root, name: &str) -> Result<Location> {
    let locs = root.location_list()?;
    let loc = locs
      .iter()
      .find(|lib| lib.name == name)
      .expect("Could not find library");

    return Ok(loc.clone());
  }

  pub async fn create_library(root: &Root, name: &str, path: &str) -> Result<(), rusqlite::Error> {
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
}
