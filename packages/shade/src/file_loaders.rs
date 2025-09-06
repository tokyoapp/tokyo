use crate::utils::convert_to_float;
use image::DynamicImage;
use rawler::{
  decoders::RawDecodeParams, imgop::develop::RawDevelop, rawsource::RawSource,
};
use std::error::Error;
use std::fmt;
use tokio::time::Instant;

/// Error type for file loading operations
#[derive(Debug)]
pub enum FileLoaderError {
  IoError(std::io::Error),
  IoStringError(String),
  DecodeError(String),
  UnsupportedFormat(String),
}

impl fmt::Display for FileLoaderError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      FileLoaderError::IoError(e) => write!(f, "IO error: {}", e),
      FileLoaderError::IoStringError(msg) => write!(f, "IO error: {}", msg),
      FileLoaderError::DecodeError(msg) => write!(f, "Decode error: {}", msg),
      FileLoaderError::UnsupportedFormat(msg) => write!(f, "Unsupported format: {}", msg),
    }
  }
}

impl Error for FileLoaderError {}

impl From<std::io::Error> for FileLoaderError {
  fn from(error: std::io::Error) -> Self {
    FileLoaderError::IoError(error)
  }
}

/// Trait for loading different image file types
pub trait ImageLoader {
  /// Check if this loader can handle the given file buffer and optional filename
  fn can_load(buffer: &[u8], filename: Option<&str>) -> bool;

  /// Load image data from buffer, returning f32 RGBA data and dimensions
  fn load(
    buffer: &[u8],
    filename: Option<&str>,
  ) -> Result<(Vec<u8>, (usize, usize)), FileLoaderError>;

  /// Write image data from buffer to disk
  // fn write(
  //   buffer: &[u8],
  //   filename: Option<&str>,
  // ) -> Result<(Vec<u8>, (usize, usize)), FileLoaderError>;

  /// Get the name of this loader for debugging
  fn loader_name() -> &'static str;
}

/// OpenEXR image loader
pub struct ExrLoader;

impl ImageLoader for ExrLoader {
  fn can_load(buffer: &[u8], filename: Option<&str>) -> bool {
    // Check magic number first
    let expected_header = [0x76, 0x2f, 0x31, 0x01];
    if buffer.len() >= 4 && buffer[0..4] == expected_header {
      return true;
    }

    // Fallback to extension check if filename is provided
    if let Some(filename) = filename {
      filename.to_lowercase().ends_with(".exr")
    } else {
      false
    }
  }

  fn load(
    buffer: &[u8],
    filename: Option<&str>,
  ) -> Result<(Vec<u8>, (usize, usize)), FileLoaderError> {
    #[cfg(not(target_arch = "wasm32"))]
    {
      use exr::prelude::*;
      use std::io::Write;

      log::info!("Loading OpenEXR from buffer (filename: {:?})", filename);

      // Create temporary file as workaround for buffer API
      let temp_file =
        std::env::temp_dir().join(format!("shade_temp_{}.exr", std::process::id()));
      {
        let mut file = std::fs::File::create(&temp_file)?;
        file.write_all(buffer)?;
      }

      let image = read_first_rgba_layer_from_file(
        &temp_file,
        |resolution, _| {
          vec![vec![(0.0, 0.0, 0.0, 1.0); resolution.width()]; resolution.height()]
        },
        |pixel_vector, position, (r, g, b, a): (f32, f32, f32, f32)| {
          pixel_vector[position.y()][position.x()] = (r, g, b, a);
        },
      )
      .map_err(|e| {
        FileLoaderError::DecodeError(format!("OpenEXR decode error: {}", e))
      })?;

      let width = image.layer_data.size.width();
      let height = image.layer_data.size.height();
      let pixel_data = image.layer_data.channel_data.pixels;

      log::info!("Successfully loaded OpenEXR: {}x{}", width, height);

      // Convert to flat byte array in f32 format
      let mut image_data = Vec::with_capacity(width * height * 16);

      for row in pixel_data {
        for (r, g, b, a) in row {
          image_data.extend_from_slice(&r.to_le_bytes());
          image_data.extend_from_slice(&g.to_le_bytes());
          image_data.extend_from_slice(&b.to_le_bytes());
          image_data.extend_from_slice(&a.to_le_bytes());
        }
      }

      // Clean up temporary file
      let _ = std::fs::remove_file(&temp_file);

      Ok((image_data, (width, height)))
    }
    #[cfg(target_arch = "wasm32")]
    {
      Err(FileLoaderError::UnsupportedFormat(
        "OpenEXR not supported in WASM".to_string(),
      ))
    }
  }

  fn loader_name() -> &'static str {
    "OpenEXR"
  }
}

/// Camera raw file loader (CR3, CR2, NEF, ARW, etc.)
pub struct RawLoader;

/// Apply EXIF orientation correction to an image
fn apply_orientation(
  img: DynamicImage,
  orientation: rawler::Orientation,
) -> DynamicImage {
  use rawler::Orientation;

  match orientation {
    Orientation::Normal => img, // No transformation needed
    Orientation::HorizontalFlip => img.fliph(), // Flip horizontal
    Orientation::Rotate180 => img.rotate180(), // Rotate 180°
    Orientation::VerticalFlip => img.flipv(), // Flip vertical
    Orientation::Transpose => img.rotate90().fliph(), // Rotate 90° CW + flip horizontal
    Orientation::Rotate90 => img.rotate90(), // Rotate 90° CW
    Orientation::Transverse => img.rotate270().fliph(), // Rotate 270° CW + flip horizontal
    Orientation::Rotate270 => img.rotate270(),          // Rotate 270° CW
    Orientation::Unknown => {
      log::warn!("Unknown orientation, applying no transformation");
      img
    }
  }
}

impl RawLoader {
  fn get_cache_params() -> String {
    // Include processing parameters that would affect the final image
    // This ensures different processing settings get separate cache entries
    "default_raw_develop".to_string()
  }
}

impl ImageLoader for RawLoader {
  fn can_load(buffer: &[u8], filename: Option<&str>) -> bool {
    // Check magic numbers for various RAW formats
    if buffer.len() >= 12 {
      // TIFF-based formats (CR2, NEF, ARW, DNG) - check TIFF magic first
      if (buffer[0] == 0x49
        && buffer[1] == 0x49
        && buffer[2] == 0x2A
        && buffer[3] == 0x00)
        || (buffer[0] == 0x4D
          && buffer[1] == 0x4D
          && buffer[2] == 0x00
          && buffer[3] == 0x2A)
      {
        return true;
      }

      // CR3 files - check for 'ftyp' box at offset 4 and 'crx ' brand
      if buffer.len() >= 20 &&
         buffer[4..8] == [0x66, 0x74, 0x79, 0x70] && // 'ftyp'
         buffer[8..12] == [0x63, 0x72, 0x78, 0x20]
      {
        // 'crx '
        return true;
      }

      // RW2 (Panasonic) - typically TIFF-based but can have specific markers
      // IIH1 for some Panasonic files
      if buffer[0..4] == [0x49, 0x49, 0x48, 0x31] {
        return true;
      }
    }

    // Fallback to extension check if filename is provided
    if let Some(filename) = filename {
      let path_lower = filename.to_lowercase();
      path_lower.ends_with(".cr3")
        || path_lower.ends_with(".cr2")
        || path_lower.ends_with(".nef")
        || path_lower.ends_with(".arw")
        || path_lower.ends_with(".dng")
        || path_lower.ends_with(".rw2")
    } else {
      false
    }
  }

  fn load(
    buffer: &[u8],
    filename: Option<&str>,
  ) -> Result<(Vec<u8>, (usize, usize)), FileLoaderError> {
    let load_start = Instant::now();

    use rawler::decoders::cr3;

    use crate::cache::ImageCache;

    // Try to load from cache first
    let cache = ImageCache::new().map_err(|e| {
      log::warn!(
        "Failed to initialize cache: {}, proceeding without cache",
        e
      );
      e
    })?;

    // let cache_key = cache.generate_cache_key(buffer, &Self::get_cache_params());

    log::info!(
      "Generate cache key in {}ms",
      load_start.elapsed().as_millis()
    );
    let load_start = Instant::now();

    // if let Some(cached_image) = cache.load_from_cache(&cache_key) {
    //   log::info!("Load from cache in {}ms", load_start.elapsed().as_millis());
    //   return Ok((cached_image.data, cached_image.dimensions));
    // }

    log::info!("Loading camera raw from buffer (filename: {:?})", filename);

    let rawsource = RawSource::new_from_slice(buffer);

    log::info!(
      "Loaded raw source at {}ms",
      load_start.elapsed().as_millis()
    );

    let rawimage =
      rawler::decode(&rawsource, &RawDecodeParams::default()).map_err(|e| {
        FileLoaderError::DecodeError(format!("Could not decode source: {}", e))
      })?;

    let orientation = rawimage.orientation;

    log::info!("Image dimensions {:?}", rawimage.dim());
    log::info!("Image orientation {:?}", orientation);

    log::info!(
      "Decoded raw image at {}ms",
      load_start.elapsed().as_millis()
    );

    let pixels = rawimage.pixels_u16();
    log::info!("Raw pixels: {} CPP: {:?}", pixels.len(), rawimage.cpp);

    let (width, height) = (rawimage.width as usize, rawimage.height as usize);
    log::info!("Raw image dimensions: {}x{}", width, height);

    let dev = RawDevelop::default();
    let image = dev.develop_intermediate(&rawimage).map_err(|e| {
      FileLoaderError::DecodeError(format!("Raw development error: {}", e))
    })?;

    log::info!(
      "Developed raw image at {}ms",
      load_start.elapsed().as_millis()
    );

    let img = image.to_dynamic_image().ok_or_else(|| {
      FileLoaderError::DecodeError("Failed to convert to dynamic image".to_string())
    })?;

    // TODO: load full res images
    let img = img.resize(2560, 2560, image::imageops::FilterType::CatmullRom);

    // Apply orientation correction
    let corrected_img = apply_orientation(img, orientation);

    let rgba_img = corrected_img.to_rgba8();
    let (width, height) = rgba_img.dimensions();
    let data = rgba_img.into_raw();

    log::info!("Successfully loaded raw image: {}x{}", width, height);

    // Convert 8-bit RGBA to 32-bit float
    let float_data = convert_to_float(&data);

    // 50ms for conversions

    log::info!(
      "Converted raw image at {}ms",
      load_start.elapsed().as_millis()
    );

    // Save to cache if cache is available
    // cache.save_to_cache(&cache_key, &float_data, (width as usize, height as usize))?;

    Ok((float_data, (width as usize, height as usize)))
  }

  fn loader_name() -> &'static str {
    "Camera Raw"
  }
}

/// Standard image format loader (JPEG, PNG, TIFF, etc.)
pub struct StandardLoader;

impl ImageLoader for StandardLoader {
  fn can_load(buffer: &[u8], filename: Option<&str>) -> bool {
    // Check magic numbers for common formats
    if buffer.len() >= 8 {
      // JPEG magic number
      if buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF {
        return true;
      }
      // PNG magic number
      if buffer[0..8] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] {
        return true;
      }
      // TIFF magic numbers (little and big endian)
      if (buffer[0] == 0x49
        && buffer[1] == 0x49
        && buffer[2] == 0x2A
        && buffer[3] == 0x00)
        || (buffer[0] == 0x4D
          && buffer[1] == 0x4D
          && buffer[2] == 0x00
          && buffer[3] == 0x2A)
      {
        return true;
      }
      // BMP magic number
      if buffer[0] == 0x42 && buffer[1] == 0x4D {
        return true;
      }
      // WEBP magic number
      if buffer.len() >= 12
        && buffer[0..4] == [0x52, 0x49, 0x46, 0x46]
        && buffer[8..12] == [0x57, 0x45, 0x42, 0x50]
      {
        return true;
      }
      // GIF magic numbers
      if buffer[0..3] == [0x47, 0x49, 0x46] {
        return true;
      }
    }

    // Fallback to extension check if filename is provided
    if let Some(filename) = filename {
      let path_lower = filename.to_lowercase();
      path_lower.ends_with(".jpg")
        || path_lower.ends_with(".jpeg")
        || path_lower.ends_with(".png")
        || path_lower.ends_with(".tiff")
        || path_lower.ends_with(".tif")
        || path_lower.ends_with(".bmp")
        || path_lower.ends_with(".webp")
        || path_lower.ends_with(".gif")
        || path_lower.ends_with(".ico")
    } else {
      false
    }
  }

  fn load(
    buffer: &[u8],
    filename: Option<&str>,
  ) -> Result<(Vec<u8>, (usize, usize)), FileLoaderError> {
    #[cfg(not(target_arch = "wasm32"))]
    {
      use crate::utils::convert_to_float;
      use image::ImageReader;

      log::info!(
        "Loading standard image from buffer (filename: {:?})",
        filename
      );

      let img_reader = ImageReader::new(std::io::Cursor::new(buffer))
        .with_guessed_format()
        .map_err(|e| {
          FileLoaderError::DecodeError(format!("Failed to create image reader: {}", e))
        })?;

      let img = img_reader.decode().map_err(|e| {
        FileLoaderError::DecodeError(format!("Image decode error: {}", e))
      })?;

      // TODO: load full res images
      let img = img.resize(2560, 2560, image::imageops::FilterType::CatmullRom);

      let rgba_img = img.to_rgba8();
      let (width, height) = rgba_img.dimensions();
      let data = rgba_img.into_raw();

      log::info!("Successfully loaded standard image: {}x{}", width, height);

      // Convert 8-bit RGBA to 32-bit float
      let float_data = convert_to_float(&data);
      Ok((float_data, (width as usize, height as usize)))
    }
    #[cfg(target_arch = "wasm32")]
    {
      Err(FileLoaderError::UnsupportedFormat(
        "Standard image loading not implemented for WASM".to_string(),
      ))
    }
  }

  fn loader_name() -> &'static str {
    "Standard Image"
  }
}

/// Factory function to load an image using the appropriate loader
pub fn load_image(
  buffer: &[u8],
  filename: Option<&str>,
) -> Result<(Vec<u8>, (usize, usize)), FileLoaderError> {
  // Provide more detailed error information
  let extension = filename
    .and_then(|f| get_file_extension(f))
    .unwrap_or_else(|| "none".to_string());

  if ExrLoader::can_load(buffer, filename) {
    log::info!(
      "Using {} loader for: {:?} ({})",
      ExrLoader::loader_name(),
      filename,
      extension
    );
    ExrLoader::load(buffer, filename)
  } else if RawLoader::can_load(buffer, filename) {
    log::info!(
      "Using {} loader for: {:?} ({})",
      RawLoader::loader_name(),
      filename,
      extension
    );
    RawLoader::load(buffer, filename)
  } else if StandardLoader::can_load(buffer, filename) {
    log::info!(
      "Using {} loader for: {:?} ({})",
      StandardLoader::loader_name(),
      filename,
      extension
    );
    StandardLoader::load(buffer, filename)
  } else {
    let supported_formats: Vec<String> = get_supported_extensions()
      .into_iter()
      .flat_map(|(_, exts)| exts.into_iter().map(|e| e.to_string()))
      .collect();

    Err(FileLoaderError::UnsupportedFormat(format!(
      "No suitable loader found for buffer (filename: {:?}, extension: {}). Supported formats: {}",
      filename,
      extension,
      supported_formats.join(", ")
    )))
  }
}

/// Detect the appropriate loader type for a buffer
pub fn detect_file_type(buffer: &[u8], filename: Option<&str>) -> Option<&'static str> {
  if ExrLoader::can_load(buffer, filename) {
    Some(ExrLoader::loader_name())
  } else if RawLoader::can_load(buffer, filename) {
    Some(RawLoader::loader_name())
  } else if StandardLoader::can_load(buffer, filename) {
    Some(StandardLoader::loader_name())
  } else {
    None
  }
}

/// Get file extension from path
pub fn get_file_extension(path: &str) -> Option<String> {
  std::path::Path::new(path)
    .extension()
    .and_then(|ext| ext.to_str())
    .map(|ext| format!(".{}", ext.to_lowercase()))
}

/// Get all available loaders for debugging/info purposes
pub fn get_supported_extensions() -> Vec<(&'static str, Vec<&'static str>)> {
  vec![
    (ExrLoader::loader_name(), vec![".exr"]),
    (
      RawLoader::loader_name(),
      vec![
        ".cr3", ".cr2", ".nef", ".arw", ".dng", ".raf", ".orf", ".rw2", ".pef", ".srw",
      ],
    ),
    (
      StandardLoader::loader_name(),
      vec![
        ".jpg", ".jpeg", ".png", ".tiff", ".tif", ".bmp", ".webp", ".gif", ".ico",
      ],
    ),
  ]
}

/// Check if a buffer/filename combination is supported by any loader
pub fn is_supported_format(buffer: &[u8], filename: Option<&str>) -> bool {
  detect_file_type(buffer, filename).is_some()
}

/// Convenience function to check if a file path is supported
pub fn is_supported_format_path(path: &str) -> bool {
  if let Ok(buffer) = std::fs::read(path) {
    is_supported_format(&buffer, Some(path))
  } else {
    false
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_exr_can_load() {
    // Test with EXR magic number
    let exr_header = [0x76, 0x2f, 0x31, 0x01, 0x00, 0x00, 0x00, 0x00];
    assert!(ExrLoader::can_load(&exr_header, None));
    assert!(ExrLoader::can_load(&exr_header, Some("test.exr")));

    // Test with filename only
    let empty_buffer = [];
    assert!(ExrLoader::can_load(&empty_buffer, Some("test.exr")));
    assert!(ExrLoader::can_load(&empty_buffer, Some("test.EXR")));
    assert!(!ExrLoader::can_load(&empty_buffer, Some("test.jpg")));
    assert!(!ExrLoader::can_load(&empty_buffer, None));
  }

  #[test]
  fn test_raw_can_load() {
    // Test with filename only
    let empty_buffer = [];
    assert!(RawLoader::can_load(&empty_buffer, Some("test.cr3")));
    assert!(RawLoader::can_load(&empty_buffer, Some("test.CR3")));
    assert!(RawLoader::can_load(&empty_buffer, Some("test.nef")));
    assert!(RawLoader::can_load(&empty_buffer, Some("test.arw")));
    assert!(!RawLoader::can_load(&empty_buffer, Some("test.jpg")));
    assert!(!RawLoader::can_load(&empty_buffer, None));
  }

  #[test]
  fn test_standard_can_load() {
    // Test with JPEG magic number
    let jpeg_header = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46];
    assert!(StandardLoader::can_load(&jpeg_header, None));

    // Test with PNG magic number
    let png_header = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    assert!(StandardLoader::can_load(&png_header, None));

    // Test with filename only
    let empty_buffer = [];
    assert!(StandardLoader::can_load(&empty_buffer, Some("test.jpg")));
    assert!(StandardLoader::can_load(&empty_buffer, Some("test.JPG")));
    assert!(StandardLoader::can_load(&empty_buffer, Some("test.png")));
    assert!(StandardLoader::can_load(&empty_buffer, Some("test.tiff")));
    assert!(!StandardLoader::can_load(&empty_buffer, Some("test.cr3")));
    assert!(!StandardLoader::can_load(&empty_buffer, None));
  }

  #[test]
  fn test_detect_file_type() {
    // Test with magic numbers
    let exr_header = [0x76, 0x2f, 0x31, 0x01];
    assert_eq!(
      detect_file_type(&exr_header, Some("test.exr")),
      Some("OpenEXR")
    );

    let jpeg_header = [0xFF, 0xD8, 0xFF, 0xE0];
    assert_eq!(
      detect_file_type(&jpeg_header, Some("test.jpg")),
      Some("Standard Image")
    );

    let tiff_header = [0x49, 0x49, 0x2A, 0x00];
    assert_eq!(
      detect_file_type(&tiff_header, Some("test.cr3")),
      Some("Camera Raw")
    );

    // Test with filename only
    let empty_buffer = [];
    assert_eq!(
      detect_file_type(&empty_buffer, Some("test.exr")),
      Some("OpenEXR")
    );
    assert_eq!(
      detect_file_type(&empty_buffer, Some("test.cr3")),
      Some("Camera Raw")
    );
    assert_eq!(
      detect_file_type(&empty_buffer, Some("test.jpg")),
      Some("Standard Image")
    );
    assert_eq!(detect_file_type(&empty_buffer, Some("test.unknown")), None);
    assert_eq!(detect_file_type(&empty_buffer, None), None);
  }

  #[test]
  fn test_get_file_extension() {
    assert_eq!(get_file_extension("test.jpg"), Some(".jpg".to_string()));
    assert_eq!(get_file_extension("test.JPG"), Some(".jpg".to_string()));
    assert_eq!(
      get_file_extension("path/to/image.cr3"),
      Some(".cr3".to_string())
    );
    assert_eq!(get_file_extension("no_extension"), None);
  }

  #[test]
  fn test_is_supported_format() {
    // Test with magic numbers
    let jpeg_header = [0xFF, 0xD8, 0xFF, 0xE0];
    assert!(is_supported_format(&jpeg_header, Some("test.jpg")));

    let exr_header = [0x76, 0x2f, 0x31, 0x01];
    assert!(is_supported_format(&exr_header, Some("test.exr")));

    let tiff_header = [0x49, 0x49, 0x2A, 0x00];
    assert!(is_supported_format(&tiff_header, Some("test.cr3")));

    // Test with filename only
    let empty_buffer = [];
    assert!(is_supported_format(&empty_buffer, Some("test.jpg")));
    assert!(is_supported_format(&empty_buffer, Some("test.cr3")));
    assert!(is_supported_format(&empty_buffer, Some("test.exr")));
    assert!(!is_supported_format(&empty_buffer, Some("test.unknown")));
    assert!(!is_supported_format(&empty_buffer, None));
  }
}
