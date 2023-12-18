#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

pub fn main() {
  let root = tokyo_db::Root::new().await;
  root.init_db().await.expect("Error at init db");

  app::AppBuilder::new().run();
}
