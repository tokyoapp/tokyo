use exr::prelude::*;
use std::io::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

macro_rules! console_log {
    // Note that this is using the `log` function imported above during
    // `bare_bones`
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn load_exr(buffer: Vec<u8>) {
    let _read = read()
        .no_deep_data()
        .largest_resolution_level()
        .rgba_channels(
            |resolution, _| {
                let default_pixel = [0.0, 0.0, 0.0, 0.0];
                let empty_line = vec![default_pixel; resolution.width()];
                let empty_image = vec![empty_line; resolution.height()];
                empty_image
            },
            |pixel_vector, position, (r, g, b, a): (f32, f32, f32, f32)| {
                pixel_vector[position.y()][position.x()] = [r, g, b, a]
            },
        )
        .first_valid_layer()
        .all_attributes();

    let mut c = Cursor::new(Vec::new());

    // Write into the "file" and seek to the beginning
    c.write_all(&buffer).unwrap();
    c.seek(SeekFrom::Start(0)).unwrap();

    console_log!("{:?}", c);

    let chunks = exr::block::read(c, false);

    match chunks {
        Ok(chnks) => {
            console_log!("Loading exr chunks");
            let _image = _read.from_chunks(chnks);
        }
        Err(e) => console_log!("error parsing header, {:?}", e),
    }
}
