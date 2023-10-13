use tauri::{App, Manager};
use window_vibrancy::{apply_blur, apply_vibrancy, NSVisualEffectMaterial};

#[cfg(mobile)]
mod mobile;
#[cfg(mobile)]
pub use mobile::*;

pub type SetupHook = Box<dyn FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send>;

#[derive(Default)]
pub struct AppBuilder {
  setup: Option<SetupHook>,
}

impl AppBuilder {
  pub fn new() -> Self {
    Self::default()
  }

  #[must_use]
  pub fn setup<F>(mut self, setup: F) -> Self
  where
    F: FnOnce(&mut App) -> Result<(), Box<dyn std::error::Error>> + Send + 'static,
  {
    self.setup.replace(Box::new(setup));
    self
  }

  pub fn run(self) {
    let setup = self.setup;
    tauri::Builder::default()
      .plugin(tauri_plugin_os::init())
      .plugin(tauri_plugin_app::init())
      .plugin(tauri_plugin_window::init())
      .plugin(tauri_plugin_library::init())
      .setup(move |app| {
        if let Some(setup) = setup {
          (setup)(app)?;
        }

        // https://github.com/tauri-apps/window-vibrancy
        let window = app.get_window("main").unwrap();

        #[cfg(target_os = "macos")]
        apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, Some(2.0))
          .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

        #[cfg(target_os = "windows")]
        apply_blur(&window, Some((18, 18, 18, 125)))
          .expect("Unsupported platform! 'apply_blur' is only supported on Windows");

        Ok(())
      })
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
  }
}
