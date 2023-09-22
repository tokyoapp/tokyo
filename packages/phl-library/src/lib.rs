pub mod image;

pub mod db;
mod images;

use db::{File, Tag};
use db::{Location, Root};
use rusqlite::Result;

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

  pub fn add_file(root: &Root, hash: &str, rating: i32) {
    let id = root.insert_tag("Test").unwrap();

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
}
