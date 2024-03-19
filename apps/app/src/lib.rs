#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_os::init())
    // .plugin(tauri_plugin_app::init())
    // .plugin(tauri_plugin_window::init())
    .plugin(tauri_plugin_tokyo::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
