mod app;

use app::{Image, TemplateApp};
use eframe;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

fn init_viewport(canvas_id: String, image_url: String, image: Image) {
    wasm_bindgen_futures::spawn_local(async move {
        eframe::WebRunner::new()
            .start(
                canvas_id.as_str(),
                eframe::WebOptions::default(),
                Box::new(move |cc| Box::new(TemplateApp::new(cc, image_url.as_str(), image))),
            )
            .await
            .expect("failed to start eframe");
    });
}

#[wasm_bindgen]
pub fn init(id: &str, url: &str, image: JsValue) {
    log(format!("init viewport on {:?}", image).as_str());

    // Redirect `log` message to `console.log` and friends:
    eframe::WebLogger::init(log::LevelFilter::Debug).ok();

    let img: Image = serde_wasm_bindgen::from_value(image).unwrap();

    init_viewport(String::from(id), String::from(url), img);
}
