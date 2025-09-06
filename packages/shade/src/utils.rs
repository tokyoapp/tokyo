#[cfg(not(target_arch = "wasm32"))]
use std::io::Write;
// use std::time::Instant;
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

#[cfg(not(target_arch = "wasm32"))]
use std::path::Path;

#[cfg(target_arch = "wasm32")]
fn get_content_div() -> web_sys::Element {
  web_sys::window()
    .and_then(|window| window.document())
    .and_then(|document| document.get_element_by_id("content"))
    .expect("Could not get document / content.")
}

/// Replaces the site body with a message telling the user to open the console and use that.
#[cfg(target_arch = "wasm32")]
pub fn add_web_nothing_to_see_msg() {
  get_content_div().set_inner_html(
        "<h1>This is a compute example, so there's nothing to see here. Open the console!</h1>",
    );
}

/// Outputs image data with 16-bit PNG precision by default.
///
/// This function automatically detects the input data format and outputs a 16-bit PNG
/// for better precision than standard 8-bit PNGs while maintaining compatibility.
#[cfg(not(target_arch = "wasm32"))]
/// Outputs image data with automatic format detection based on file extension.
///
/// This function automatically chooses the best output format based on the file extension:
/// - `.exr` -> OpenEXR (32-bit float HDR format)
/// - `.png` -> 16-bit PNG (high quality, good compatibility)
/// - `.jpg`, `.jpeg` -> 8-bit JPEG (standard format)
/// - `.raw`, `.f32` -> Raw 32-bit float binary data
/// - Other extensions -> Default to 16-bit PNG
///
/// Input data is assumed to be 32-bit float RGBA (16 bytes per pixel).
///
/// # Arguments
///
/// * `image_data` - Raw 32-bit float RGBA image data
/// * `texture_dims` - Image dimensions as (width, height)
/// * `path` - Output file path (extension determines format)
#[cfg(not(target_arch = "wasm32"))]
pub fn write_image(image_data: Vec<u8>, texture_dims: (usize, usize), path: String) {
  let pixels = texture_dims.0 * texture_dims.1;

  // Ensure we have 32-bit float data (16 bytes per pixel)
  if image_data.len() != pixels * 16 {
    log::error!(
      "Expected {} bytes for 32-bit float data, got {}",
      pixels * 16,
      image_data.len()
    );
    return;
  }

  // Determine output format from file extension
  let path_lower = path.to_lowercase();

  if path_lower.ends_with(".jpg") || path_lower.ends_with(".jpeg") {
    // Convert to 8-bit JPEG
    let mut u8_data = Vec::with_capacity(pixels * 4);
    for chunk in image_data.chunks(16) {
      let r = f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]);
      let g = f32::from_le_bytes([chunk[4], chunk[5], chunk[6], chunk[7]]);
      let b = f32::from_le_bytes([chunk[8], chunk[9], chunk[10], chunk[11]]);
      let a = f32::from_le_bytes([chunk[12], chunk[13], chunk[14], chunk[15]]);

      u8_data.push((r.clamp(0.0, 1.0) * 255.0) as u8);
      u8_data.push((g.clamp(0.0, 1.0) * 255.0) as u8);
      u8_data.push((b.clamp(0.0, 1.0) * 255.0) as u8);
      u8_data.push((a.clamp(0.0, 1.0) * 255.0) as u8);
    }

    let mut png_data = Vec::<u8>::new();
    let mut encoder = png::Encoder::new(
      std::io::Cursor::new(&mut png_data),
      texture_dims.0 as u32,
      texture_dims.1 as u32,
    );
    encoder.set_color(png::ColorType::Rgba);
    encoder.set_depth(png::BitDepth::Eight);
    let mut png_writer = encoder.write_header().unwrap();
    png_writer.write_image_data(&u8_data[..]).unwrap();
    png_writer.finish().unwrap();

    let mut file = std::fs::File::create(&path).unwrap();
    file.write_all(&png_data[..]).unwrap();
    log::info!("8-bit PNG file written to disc as \"{path}\".");
    return;
  } else {
    // Default to 16-bit PNG for maximum quality and compatibility
    let mut u32_data = Vec::with_capacity(pixels * 4);
    for chunk in image_data.chunks(16) {
      let r = f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]);
      let g = f32::from_le_bytes([chunk[4], chunk[5], chunk[6], chunk[7]]);
      let b = f32::from_le_bytes([chunk[8], chunk[9], chunk[10], chunk[11]]);
      let a = f32::from_le_bytes([chunk[12], chunk[13], chunk[14], chunk[15]]);

      // Convert to u32 maintaining full precision (scale by u32::MAX for 0.0-1.0 range)
      u32_data.push((r.clamp(0.0, 1.0) * u32::MAX as f32) as u32);
      u32_data.push((g.clamp(0.0, 1.0) * u32::MAX as f32) as u32);
      u32_data.push((b.clamp(0.0, 1.0) * u32::MAX as f32) as u32);
      u32_data.push((a.clamp(0.0, 1.0) * u32::MAX as f32) as u32);
    }

    let mut png_data = Vec::<u8>::new();
    let mut encoder = png::Encoder::new(
      std::io::Cursor::new(&mut png_data),
      texture_dims.0 as u32,
      texture_dims.1 as u32,
    );
    encoder.set_color(png::ColorType::Rgba);
    encoder.set_depth(png::BitDepth::Sixteen);
    let mut png_writer = encoder.write_header().unwrap();

    // Convert u32 to u16 for 16-bit PNG (still much better than 8-bit)
    let mut u16_data = Vec::with_capacity(u32_data.len() * 2);
    for value in u32_data {
      u16_data.extend_from_slice(&((value >> 16) as u16).to_be_bytes());
    }

    png_writer.write_image_data(&u16_data[..]).unwrap();
    png_writer.finish().unwrap();
    log::info!("PNG file encoded in memory as 16-bit (preserving high precision).");

    let mut file = std::fs::File::create(&path).unwrap();
    file.write_all(&png_data[..]).unwrap();
    log::info!("16-bit PNG file written to disc as \"{path}\".");
  }
}

/// Attempts to load an OpenEXR image file
///
/// Returns a tuple of (image_data, dimensions) where image_data is in f32 RGBA format
/// and dimensions is (width, height).
#[cfg(not(target_arch = "wasm32"))]
pub fn load_openexr_image(
  path: &str,
) -> Result<(Vec<u8>, (usize, usize)), Box<dyn std::error::Error>> {
  use exr::prelude::*;

  log::info!("Attempting to load OpenEXR file: {}", path);

  // Read the OpenEXR file
  let image = read_first_rgba_layer_from_file(
    path,
    // Specify how to load the pixels
    |resolution, _| {
      // Create a buffer to hold RGBA f32 data
      vec![vec![(0.0, 0.0, 0.0, 1.0); resolution.width()]; resolution.height()]
    },
    // Specify how to handle each pixel
    |pixel_vector, position, (r, g, b, a): (f32, f32, f32, f32)| {
      pixel_vector[position.y()][position.x()] = (r, g, b, a);
    },
  )?;

  let width = image.layer_data.size.width();
  let height = image.layer_data.size.height();
  let pixel_data = image.layer_data.channel_data.pixels;

  log::info!("Successfully loaded OpenEXR: {}x{}", width, height);

  // Convert to flat byte array in f32 format
  let mut image_data = Vec::with_capacity(width * height * 16); // 4 channels * 4 bytes per f32

  for row in pixel_data {
    for (r, g, b, a) in row {
      image_data.extend_from_slice(&r.to_le_bytes());
      image_data.extend_from_slice(&g.to_le_bytes());
      image_data.extend_from_slice(&b.to_le_bytes());
      image_data.extend_from_slice(&a.to_le_bytes());
    }
  }

  Ok((image_data, (width, height)))
}

/// Helper function to check if a file is an OpenEXR file based on file header
#[cfg(not(target_arch = "wasm32"))]
pub fn is_openexr_file(path: &str) -> bool {
  use std::fs::File;
  use std::io::Read;

  // OpenEXR files start with a 4-byte magic number: 0x762f3101
  let expected_header = [0x76, 0x2f, 0x31, 0x01];

  let mut file = match File::open(path) {
    Ok(file) => file,
    Err(_) => return false,
  };

  let mut header = [0u8; 4];
  match file.read_exact(&mut header) {
    Ok(_) => header == expected_header,
    Err(_) => false,
  }
}

/// Writes an OpenEXR image file from f32 RGBA data
#[cfg(not(target_arch = "wasm32"))]
pub fn write_openexr_image(image_data: &[u8], texture_dims: (usize, usize), path: &str) {
  use exr::prelude::*;

  log::info!("Writing OpenEXR file: {}", path);

  let (width, height) = texture_dims;
  let pixels = width * height;

  // Convert byte data back to f32 RGBA values
  let mut rgba_data = Vec::with_capacity(pixels);
  for chunk in image_data.chunks(16) {
    let r = f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]);
    let g = f32::from_le_bytes([chunk[4], chunk[5], chunk[6], chunk[7]]);
    let b = f32::from_le_bytes([chunk[8], chunk[9], chunk[10], chunk[11]]);
    let a = f32::from_le_bytes([chunk[12], chunk[13], chunk[14], chunk[15]]);

    rgba_data.push((r, g, b, a));
  }

  // Create the image
  // let layer = Layer::new(
  //   (width, height),
  //   LayerAttributes::named("rgba"),
  //   Encoding::SMALL_FAST_LOSSLESS,
  //   SpecificChannels::rgba(|position| {
  //     let index = position.y() * width + position.x();
  //     if index < rgba_data.len() {
  //       let (r, g, b, a) = rgba_data[index];
  //       (r, g, b, a)
  //     } else {
  //       (0.0, 0.0, 0.0, 1.0)
  //     }
  //   }),
  // );

  // let image = Image::from_layer(layer);

  // Write the image
  // match image.write_to_file(path) {
  //   Ok(_) => log::info!("Successfully wrote OpenEXR file: {}", path),
  //   Err(e) => log::error!("Failed to write OpenEXR file: {}", e),
  // }
}

/// Effectively a version of `output_image_native` but meant for web browser contexts.
///
/// This is achieved via in `img` element on the page. If the target image element does
/// not exist, this function creates one. If it does, the image data is overridden.
///
/// This function makes use of a hidden staging canvas which the data is copied to in
/// order to create a data URL.
#[cfg(target_arch = "wasm32")]
pub fn output_image_wasm(image_data: Vec<u8>, texture_dims: (usize, usize)) {
  // Note: Canvas ImageData only supports 8-bit RGBA, so we have to convert
  // higher precision data to 8-bit for web display, but we preserve more precision than before
  let pixels = texture_dims.0 * texture_dims.1;
  let converted_data = if image_data.len() == pixels * 16 {
    // 32-bit float data (16 bytes per pixel: 4 channels * 4 bytes per float)
    let mut u8_data = Vec::with_capacity(pixels * 4);
    for chunk in image_data.chunks(16) {
      let r = f32::from_le_bytes([chunk[0], chunk[1], chunk[2], chunk[3]]);
      let g = f32::from_le_bytes([chunk[4], chunk[5], chunk[6], chunk[7]]);
      let b = f32::from_le_bytes([chunk[8], chunk[9], chunk[10], chunk[11]]);
      let a = f32::from_le_bytes([chunk[12], chunk[13], chunk[14], chunk[15]]);

      // Use better gamma correction for higher quality conversion
      u8_data.push((r.clamp(0.0, 1.0).powf(1.0 / 2.2) * 255.0) as u8);
      u8_data.push((g.clamp(0.0, 1.0).powf(1.0 / 2.2) * 255.0) as u8);
      u8_data.push((b.clamp(0.0, 1.0).powf(1.0 / 2.2) * 255.0) as u8);
      u8_data.push((a.clamp(0.0, 1.0) * 255.0) as u8);
    }
    u8_data
  } else if image_data.len() == pixels * 8 {
    // 16-bit float data (8 bytes per pixel: 4 channels * 2 bytes per f16)
    let mut u8_data = Vec::with_capacity(pixels * 4);
    for chunk in image_data.chunks(8) {
      let r = half::f16::from_le_bytes([chunk[0], chunk[1]]).to_f32();
      let g = half::f16::from_le_bytes([chunk[2], chunk[3]]).to_f32();
      let b = half::f16::from_le_bytes([chunk[4], chunk[5]]).to_f32();
      let a = half::f16::from_le_bytes([chunk[6], chunk[7]]).to_f32();

      // Use better gamma correction for higher quality conversion
      u8_data.push((r.clamp(0.0, 1.0).powf(1.0 / 2.2) * 255.0) as u8);
      u8_data.push((g.clamp(0.0, 1.0).powf(1.0 / 2.2) * 255.0) as u8);
      u8_data.push((b.clamp(0.0, 1.0).powf(1.0 / 2.2) * 255.0) as u8);
      u8_data.push((a.clamp(0.0, 1.0) * 255.0) as u8);
    }
    u8_data
  } else {
    // Already 8-bit data
    image_data
  };

  let document = web_sys::window().unwrap().document().unwrap();
  let content_div = get_content_div();

  let canvas = if let Some(found_canvas) = document.get_element_by_id("staging-canvas") {
    match found_canvas.dyn_into::<web_sys::HtmlCanvasElement>() {
      Ok(canvas_as_canvas) => canvas_as_canvas,
      Err(e) => {
        log::error!(
          "In searching for a staging canvas for outputting an image \
                    (element with id \"staging-canvas\"), found non-canvas element: {e:?}.
                    Replacing with standard staging canvas."
        );
        e.remove();
        create_staging_canvas(&document)
      }
    }
  } else {
    log::info!("Output image staging canvas element not found; creating.");
    create_staging_canvas(&document)
  };
  // Having the size attributes the right size is so important, we should always do it
  // just to be safe. Also, what if we might want the image size to be able to change?
  let image_dimension_strings = (texture_dims.0.to_string(), texture_dims.1.to_string());
  canvas
    .set_attribute("width", image_dimension_strings.0.as_str())
    .unwrap();
  canvas
    .set_attribute("height", image_dimension_strings.1.as_str())
    .unwrap();

  let context = canvas
    .get_context("2d")
    .unwrap()
    .unwrap()
    .dyn_into::<web_sys::CanvasRenderingContext2d>()
    .unwrap();
  let image_data = web_sys::ImageData::new_with_u8_clamped_array(
    wasm_bindgen::Clamped(&converted_data),
    texture_dims.0 as u32,
  )
  .unwrap();
  context.put_image_data(&image_data, 0.0, 0.0).unwrap();

  // Get the img element that will act as our target for rendering from the canvas.
  let image_element = if let Some(found_image_element) =
    document.get_element_by_id("output-image-target")
  {
    match found_image_element.dyn_into::<web_sys::HtmlImageElement>() {
      Ok(e) => e,
      Err(e) => {
        log::error!(
                    "Found an element with the id \"output-image-target\" but it was not an image: {e:?}.
                    Replacing with default image output element.",
                );
        e.remove();
        create_output_image_element(&document)
      }
    }
  } else {
    log::info!("Output image element not found; creating.");
    create_output_image_element(&document)
  };
  // The canvas is currently the image we ultimately want. We can create a data url from it now.
  let data_url = canvas.to_data_url().unwrap();
  image_element.set_src(&data_url);
  log::info!(
    "Copied image from staging canvas to image element (note: displayed as 8-bit due to canvas limitations, but native output preserves higher precision)."
  );

  if document.get_element_by_id("image-for-you-text").is_none() {
    log::info!("\"Image for you\" text not found; creating.");
    let p = document
      .create_element("p")
      .expect("Failed to create p element for \"image for you text\".");
    p.set_text_content(Some(
      "The above image is for you!
        You can drag it to your desktop to download.",
    ));
    p.set_id("image-for-you-text");
    content_div
      .append_child(&p)
      .expect("Failed to append \"image for you text\" to document.");
  }
}

#[cfg(target_arch = "wasm32")]
fn create_staging_canvas(document: &web_sys::Document) -> web_sys::HtmlCanvasElement {
  let content_div = get_content_div();
  let new_canvas = document
    .create_element("canvas")
    .expect("Failed to create staging canvas.")
    .dyn_into::<web_sys::HtmlCanvasElement>()
    .unwrap();
  // We don't want to show the canvas, we just want it to exist in the background.
  new_canvas.set_attribute("hidden", "true").unwrap();
  new_canvas.set_attribute("background-color", "red").unwrap();
  content_div.append_child(&new_canvas).unwrap();
  log::info!("Created new staging canvas: {:?}", &new_canvas);
  new_canvas
}

#[cfg(target_arch = "wasm32")]
fn create_output_image_element(
  document: &web_sys::Document,
) -> web_sys::HtmlImageElement {
  let content_div = get_content_div();
  let new_image = document
    .create_element("img")
    .expect("Failed to create output image element.")
    .dyn_into::<web_sys::HtmlImageElement>()
    .unwrap();
  new_image.set_id("output-image-target");
  content_div.replace_children_with_node_1(&new_image);
  log::info!("Created new output target image: {:?}", &new_image);
  new_image
}

// Helper function to convert 8-bit RGBA to 32-bit float format
pub fn convert_to_float(data: &[u8]) -> Vec<u8> {
  let mut float_data = Vec::with_capacity(data.len() * 4); // 4x expansion for f32
  for chunk in data.chunks(4) {
    let r = chunk[0] as f32 / 255.0;
    let g = chunk[1] as f32 / 255.0;
    let b = chunk[2] as f32 / 255.0;
    let a = chunk[3] as f32 / 255.0;

    float_data.extend_from_slice(&r.to_le_bytes());
    float_data.extend_from_slice(&g.to_le_bytes());
    float_data.extend_from_slice(&b.to_le_bytes());
    float_data.extend_from_slice(&a.to_le_bytes());
  }
  float_data
}
