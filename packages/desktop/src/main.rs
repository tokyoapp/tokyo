// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

pub fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_os::init())
    // .plugin(tauri_plugin_app::init())
    // .plugin(tauri_plugin_window::init())
    .plugin(tauri_plugin_tokyo::init())
    // .setup(move |app| {
    //   let window = app.get_webview_window("main").unwrap();
    //   #[cfg(target_os = "macos")]
    //   apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, Some(1.0))
    //     .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
    //   #[cfg(target_os = "windows")]
    //   apply_blur(&window, Some((18, 18, 18, 125)))
    //     .expect("Unsupported platform! 'apply_blur' is only supported on Windows");

    //   Ok(())
    // })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
