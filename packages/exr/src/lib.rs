use openexr::*;
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
    use imath_traits::Zero;

    let mut file = RgbaInputFile::new(path, 1).unwrap();
    // Note that windows in OpenEXR are ***inclusive*** bounds, so a
    // 1920x1080 image has window [0, 0, 1919, 1079].
    let data_window: [i32; 4] = *file.header().data_window();
    let width = data_window.width() + 1;
    let height = data_window.height() + 1;

    let mut pixels = vec![Rgba::zero(); (width * height) as usize];
    file.set_frame_buffer(&mut pixels, 1, width as usize)?;
    unsafe {
        file.read_pixels(0, height - 1)?;
    }

    Ok(())
}
