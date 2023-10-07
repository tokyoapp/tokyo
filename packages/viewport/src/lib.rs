mod viewport;

use eframe;
use viewport::EditSettings;
use viewport::{Image, ViewportApp};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures;

#[wasm_bindgen]
extern "C" {
  #[wasm_bindgen(js_namespace = console)]
  fn log(s: &str);
}

#[wasm_bindgen(module = "/src/lib.js")]
extern "C" {
  fn state(state: JsValue);
}

#[derive(serde::Serialize, serde::Deserialize)]
#[wasm_bindgen]
pub struct AppState {
  zoom: f32,
}

pub fn post_state(app: &mut ViewportApp) {
  let s = AppState { zoom: app.zoom };
  state(serde_wasm_bindgen::to_value(&s).unwrap());
}

#[cfg(target_arch = "wasm32")]
#[derive(Clone)]
#[wasm_bindgen]
pub struct WebHandle {
  runner: eframe::WebRunner,
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
impl WebHandle {
  /// Installs a panic hook, then returns.
  #[allow(clippy::new_without_default)]
  #[wasm_bindgen(constructor)]
  pub fn new() -> Self {
    // Redirect [`log`] message to `console.log` and friends:
    eframe::WebLogger::init(log::LevelFilter::Debug).ok();

    Self {
      runner: eframe::WebRunner::new(),
    }
  }

  /// Call this once from JavaScript to start your app.
  #[wasm_bindgen]
  pub async fn start(
    &self,
    id: &str,
    url: &str,
    image: JsValue,
  ) -> Result<(), wasm_bindgen::JsValue> {
    log(format!("init viewport on {:?}", image).as_str());

    let image_url = String::from(url);
    let img: Image = serde_wasm_bindgen::from_value(image).unwrap();

    self
      .runner
      .start(
        id,
        eframe::WebOptions::default(),
        Box::new(move |cc| Box::new(ViewportApp::new(cc, image_url.as_str(), img))),
      )
      .await
  }

  // The following are optional:

  #[wasm_bindgen]
  pub fn destroy(&self) {
    self.runner.destroy();
  }

  #[wasm_bindgen]
  pub fn apply_edit(&self, settings: JsValue) {
    let edit: EditSettings = serde_wasm_bindgen::from_value(settings).unwrap();

    log(&format!("edit {:?}", edit).to_string());

    // if let Some(app) = self.runner.app_mut::<TemplateApp>() {
    //     app.example();
    // }
  }

  /// The JavaScript can check whether or not your app has crashed:
  #[wasm_bindgen]
  pub fn has_panicked(&self) -> bool {
    self.runner.has_panicked()
  }

  #[wasm_bindgen]
  pub fn panic_message(&self) -> Option<String> {
    self.runner.panic_summary().map(|s| s.message())
  }

  #[wasm_bindgen]
  pub fn panic_callstack(&self) -> Option<String> {
    self.runner.panic_summary().map(|s| s.callstack())
  }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn init() -> WebHandle {
  let handle = WebHandle::new();
  return handle;
}
