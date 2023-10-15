#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use phl_library::db;

pub fn main() {
  let root = db::Root::new();
  root.init_db().expect("Error at init db");

  app::AppBuilder::new().run();
}
