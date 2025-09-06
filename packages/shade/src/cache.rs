use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;
use tokio::time::Instant;

use crate::file_loaders::FileLoaderError;

#[derive(Serialize, Deserialize)]
pub struct CachedImage {
  pub data: Vec<u8>,
  pub dimensions: (usize, usize),
  pub cache_version: u8,
}

pub struct ImageCache {
  pub cache_dir: PathBuf,
}

impl ImageCache {
  const CACHE_VERSION: u8 = 1;
  const CACHE_SUBDIR: &'static str = "raw_cache";

  pub fn new() -> Result<Self, FileLoaderError> {
    let cache_dir = Self::get_cache_directory()?;

    // Create cache directory if it doesn't exist
    if !cache_dir.exists() {
      fs::create_dir_all(&cache_dir).map_err(|e| {
        FileLoaderError::IoStringError(format!("Failed to create cache directory: {}", e))
      })?;
    }

    let cache = Self { cache_dir };

    // Clean up old cache files (older than 30 days)
    if let Err(e) = cache.cleanup_old_cache(30) {
      log::warn!("Failed to cleanup old cache files: {}", e);
    }

    Ok(cache)
  }

  fn get_cache_directory() -> Result<PathBuf, FileLoaderError> {
    #[cfg(not(target_arch = "wasm32"))]
    {
      // Try to use platform-specific cache directory
      if let Some(cache_dir) = dirs::cache_dir() {
        Ok(cache_dir.join("shade").join(Self::CACHE_SUBDIR))
      } else if let Some(home_dir) = dirs::home_dir() {
        Ok(
          home_dir
            .join(".cache")
            .join("shade")
            .join(Self::CACHE_SUBDIR),
        )
      } else {
        // Fallback to temp directory
        Ok(std::env::temp_dir().join("shade").join(Self::CACHE_SUBDIR))
      }
    }
    #[cfg(target_arch = "wasm32")]
    {
      Err(FileLoaderError::UnsupportedFormat(
        "Persistent cache not supported in WASM".to_string(),
      ))
    }
  }

  pub fn generate_cache_key(&self, buffer: &[u8], params: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(buffer);
    hasher.update(params.as_bytes());
    hasher.update(&[Self::CACHE_VERSION]); // Include version in hash
    format!("{:x}", hasher.finalize())
  }

  pub fn get_cache_path(&self, cache_key: &str) -> PathBuf {
    self.cache_dir.join(format!("{}.cache", cache_key))
  }

  pub fn load_from_cache(&self, cache_key: &str) -> Option<CachedImage> {
    let time = Instant::now();

    let cache_path = self.get_cache_path(cache_key);
    if !cache_path.exists() {
      return None;
    }

    match fs::read(&cache_path) {
      Ok(data) => {
        log::info!("Cache read in {}ms", time.elapsed().as_millis());
        let time = Instant::now();

        match bincode::deserialize::<CachedImage>(&data) {
          Ok(cached_image) => {
            log::info!("Cache deserialized in {}ms", time.elapsed().as_millis());

            // Check cache version compatibility
            if cached_image.cache_version == Self::CACHE_VERSION {
              log::info!("Cache hit for key: {}", cache_key);
              Some(cached_image)
            } else {
              log::info!(
                "Cache version mismatch for key: {}, removing old cache",
                cache_key
              );
              // Remove outdated cache file
              let _ = fs::remove_file(&cache_path);
              None
            }
          }
          Err(e) => {
            log::warn!(
              "Failed to deserialize cache file {}: {}",
              cache_path.display(),
              e
            );
            // Remove corrupted cache file
            let _ = fs::remove_file(&cache_path);
            None
          }
        }
      }
      Err(e) => {
        log::warn!("Failed to read cache file {}: {}", cache_path.display(), e);
        None
      }
    }
  }

  pub fn save_to_cache(
    &self,
    cache_key: &str,
    data: &[u8],
    dimensions: (usize, usize),
  ) -> Result<(), FileLoaderError> {
    let cached_image = CachedImage {
      data: data.to_vec(),
      dimensions,
      cache_version: Self::CACHE_VERSION,
    };

    let serialized = bincode::serialize(&cached_image).map_err(|e| {
      FileLoaderError::IoStringError(format!("Failed to serialize cache data: {}", e))
    })?;

    let serialized_len = serialized.len();
    let cache_path = self.get_cache_path(cache_key);
    fs::write(&cache_path, serialized).map_err(|e| {
      FileLoaderError::IoStringError(format!("Failed to write cache file: {}", e))
    })?;

    log::info!("Saved to cache: {} ({} bytes)", cache_key, serialized_len);
    Ok(())
  }

  pub fn clear_cache(&self) -> Result<(), FileLoaderError> {
    if self.cache_dir.exists() {
      fs::remove_dir_all(&self.cache_dir).map_err(|e| {
        FileLoaderError::IoStringError(format!("Failed to clear cache directory: {}", e))
      })?;

      // Recreate the directory
      fs::create_dir_all(&self.cache_dir).map_err(|e| {
        FileLoaderError::IoStringError(format!(
          "Failed to recreate cache directory: {}",
          e
        ))
      })?;
    }

    log::info!("Cache cleared");
    Ok(())
  }

  pub fn get_cache_size(&self) -> Result<u64, FileLoaderError> {
    if !self.cache_dir.exists() {
      return Ok(0);
    }

    let mut total_size = 0u64;
    let entries = fs::read_dir(&self.cache_dir).map_err(|e| {
      FileLoaderError::IoStringError(format!("Failed to read cache directory: {}", e))
    })?;

    for entry in entries {
      if let Ok(entry) = entry {
        if let Ok(metadata) = entry.metadata() {
          if metadata.is_file() {
            total_size += metadata.len();
          }
        }
      }
    }

    Ok(total_size)
  }

  pub fn cleanup_old_cache(&self, max_age_days: u64) -> Result<u64, FileLoaderError> {
    if !self.cache_dir.exists() {
      return Ok(0);
    }

    let cutoff = std::time::SystemTime::now()
      .duration_since(std::time::UNIX_EPOCH)
      .unwrap()
      .as_secs()
      .saturating_sub(max_age_days * 24 * 60 * 60);

    let entries = fs::read_dir(&self.cache_dir).map_err(|e| {
      FileLoaderError::IoStringError(format!("Failed to read cache directory: {}", e))
    })?;

    let mut removed_count = 0u64;
    for entry in entries {
      if let Ok(entry) = entry {
        if let Ok(metadata) = entry.metadata() {
          if metadata.is_file() {
            if let Ok(modified) = metadata.modified() {
              if let Ok(duration) = modified.duration_since(std::time::UNIX_EPOCH) {
                if duration.as_secs() < cutoff {
                  if fs::remove_file(entry.path()).is_ok() {
                    removed_count += 1;
                  }
                }
              }
            }
          }
        }
      }
    }

    if removed_count > 0 {
      log::info!("Cleaned up {} old cache files", removed_count);
    }

    Ok(removed_count)
  }
}

impl Default for ImageCache {
  fn default() -> Self {
    Self::new().expect("Failed to create image cache")
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_cache_key_generation() {
    let cache = ImageCache::new().unwrap();
    let data = b"test image data";
    let params = "default_params";

    let key1 = cache.generate_cache_key(data, params);
    let key2 = cache.generate_cache_key(data, params);

    assert_eq!(key1, key2);
    assert_eq!(key1.len(), 64); // SHA256 hex string
  }

  #[test]
  fn test_cache_key_different_data() {
    let cache = ImageCache::new().unwrap();
    let data1 = b"test image data 1";
    let data2 = b"test image data 2";
    let params = "default_params";

    let key1 = cache.generate_cache_key(data1, params);
    let key2 = cache.generate_cache_key(data2, params);

    assert_ne!(key1, key2);
  }
}
