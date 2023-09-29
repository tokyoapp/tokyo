#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use phl_library::db;

pub fn main() {
  let root = db::Root::new();
  let _ = root.init_db();

  app::AppBuilder::new().run();
}
