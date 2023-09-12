mod app;

use app::TemplateApp;
use eframe;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn init(id: &str) {
    log(format!("wasm test {}", id).as_str());
    let canvas_id = String::from(id);

    // Redirect `log` message to `console.log` and friends:
    eframe::WebLogger::init(log::LevelFilter::Debug).ok();

    wasm_bindgen_futures::spawn_local(async move {
        eframe::WebRunner::new()
            .start(
                canvas_id.as_str(),
                eframe::WebOptions::default(),
                Box::new(|cc| Box::new(TemplateApp::new(cc))),
            )
            .await
            .expect("failed to start eframe");
    });

    log("test wasm test");
}
