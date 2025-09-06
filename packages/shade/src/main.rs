mod cache;
mod cli;
mod config;
mod file_loaders;
mod protocol;
mod server;
mod shade;
mod utils;

use crate::cache::ImageCache;
use crate::config::config_from_ini_path;
use crate::file_loaders::load_image;
#[cfg(target_arch = "wasm32")]
use crate::utils::output_image_wasm;
use anyhow::Result;
use cli::ProcessingConfig;
use server::ImageProcessingServer;
#[cfg(not(target_arch = "wasm32"))]
use utils::write_image;

const TEXTURE_DIMS: (usize, usize) = (512, 512);

struct LoadedImage {
  texture_data: Vec<u8>,
  actual_dims: (usize, usize),
}

#[derive(Default)]
struct Performance {
  image_load_ms: f64,
  image_decode_ms: f64,
  gpu_setup_ms: f64,
  processing_ms: f64,
  output_ms: f64,
  total_ms: f64,
}

impl Performance {
  fn print_all(&self) {
    log::info!("[Perf] image_load_ms: {:.2}", self.image_load_ms);
    log::info!("[Perf] image_decode_ms: {:.2}", self.image_decode_ms);
    log::info!("[Perf] gpu_setup_ms: {:.2}", self.gpu_setup_ms);
    log::info!("[Perf] processing_ms: {:.2}", self.processing_ms);
    log::info!("[Perf] output_ms: {:.2}", self.output_ms);
    log::info!("[Perf] total_ms: {:.2}", self.total_ms);
  }
}

pub fn main() -> Result<()> {
  env_logger::builder().format_timestamp_millis().format_source_path(true).init();

  let run_start = std::time::Instant::now();

  #[cfg(not(target_arch = "wasm32"))]
  {
    // Check if we should run in socket mode
    let args: Vec<String> = std::env::args().collect();
    if args.len() > 1 && args[1] == "--socket" {
      let mut server = ImageProcessingServer::new();
      let res = server.run_socket_mode_sync();
      if let Err(e) = res {
        eprintln!("Socket server error: {:?}", e);
        std::process::exit(1);
      }
      return Ok(());
    }

    // Check for --list-formats before full CLI parsing
    if args.iter().any(|arg| arg == "--list-formats") {
      cli::print_supported_formats();
      return Ok(());
    }

    let config = ProcessingConfig::from_args().map_err(|e| anyhow::anyhow!("{}", e))?;

    // Check if a custom config file path was provided
    let final_config = if let Some(config_path) = &config.config_path {
      // Use custom config file path
      match config_from_ini_path(config_path) {
        Ok(ini_config) => {
          log::info!("Loaded config from: {:?}", config_path);
          ini_config
        }
        Err(e) => {
          eprintln!("Error loading config from {}: {}", config_path.display(), e);
          std::process::exit(1);
        }
      }
    } else {
      config
    };

    if let Err(e) = cli::validate_config(&final_config) {
      eprintln!("Error: {}", e);
      std::process::exit(1);
    }

    // Handle cache management options
    if final_config.clear_cache || final_config.show_cache_info {
      match ImageCache::new() {
        Ok(cache) => {
          if final_config.clear_cache {
            match cache.clear_cache() {
              Ok(()) => {
                eprintln!("Cache cleared successfully");
              }
              Err(e) => {
                eprintln!("Failed to clear cache: {}", e);
                std::process::exit(1);
              }
            }
          }

          if final_config.show_cache_info {
            match cache.get_cache_size() {
              Ok(size) => {
                let size_mb = size as f64 / (1024.0 * 1024.0);
                let cache_dir = cache
                  .get_cache_path("")
                  .parent()
                  .map(|p| p.to_path_buf())
                  .unwrap_or_else(|| std::path::PathBuf::from(""));
                eprintln!("Cache location: {}", cache_dir.display());
                eprintln!("Cache size: {:.2} MB ({} bytes)", size_mb, size);
                eprintln!("Cache dir: {:?}", cache.cache_dir);
              }
              Err(e) => {
                eprintln!("Failed to get cache info: {}", e);
              }
            }
          }

          // If we only ran cache commands, exit
          if final_config.input_path.is_none() {
            return Ok(());
          }
        }
        Err(e) => {
          eprintln!("Failed to initialize cache: {}", e);
          if final_config.clear_cache || final_config.show_cache_info {
            std::process::exit(1);
          }
        }
      }
    }

    if final_config.verbose {
      final_config.print_pipeline_info();
    }

    log::info!("Parse config: {:?}", run_start.elapsed());

    let res = pollster::block_on(run(&final_config));

    if let Err(e) = res {
      eprintln!("Error: {:?}", e);
    }
  }
  #[cfg(target_arch = "wasm32")]
  {
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
    console_log::init_with_level(log::Level::Info).expect("could not initialize logger");
    // Create a default config for WASM
    let default_config = ProcessingConfig::default();
    wasm_bindgen_futures::spawn_local(async move {
      let _ = run(&default_config).await;
    });
  }

  Ok(())
}

async fn run(config: &ProcessingConfig) -> Result<()> {
  let run_start = std::time::Instant::now();
  let mut timing = Performance::default();

  // load image
  log::info!("Loading image: {:?}", config.input_path);

  // Load input image if provided
  let (texture_data, actual_dims) = if let Some(input_path) = &config.input_path {
    #[cfg(not(target_arch = "wasm32"))]
    {
      // Load image file into memory
      let image_file = std::fs::read(&input_path)?;

      let load_time = run_start.elapsed();
      timing.image_load_ms = load_time.as_secs_f64() * 1000.0;

      match load_image(&image_file, Some(&input_path.to_string_lossy())) {
        Ok((image_data, (width, height))) => {
          log::info!("Successfully loaded image: {}x{}", width, height);
          (image_data, (width, height))
        }
        Err(e) => {
          log::error!("Failed to load image: {}", e);
          // Fallback to default texture
          let default_data = (0..(TEXTURE_DIMS.0 * TEXTURE_DIMS.1))
            .flat_map(|_| [0u8, 0u8, 0u8, 255u8])
            .collect::<Vec<u8>>();
          let float_data = crate::utils::convert_to_float(&default_data);
          (float_data, TEXTURE_DIMS)
        }
      }
    }
    #[cfg(target_arch = "wasm32")]
    {
      // For WASM, we'll use default texture for now
      let default_data = (0..(TEXTURE_DIMS.0 * TEXTURE_DIMS.1))
        .flat_map(|_| [0u8, 0u8, 0u8, 255u8])
        .collect::<Vec<u8>>();
      let float_data = crate::utils::convert_to_float(&default_data);
      (float_data, TEXTURE_DIMS)
    }
  } else {
    // No input image provided, use default texture
    let default_data = (0..(TEXTURE_DIMS.0 * TEXTURE_DIMS.1))
      .flat_map(|_| [0u8, 0u8, 0u8, 255u8])
      .collect::<Vec<u8>>();
    let float_data = crate::utils::convert_to_float(&default_data);
    (float_data, TEXTURE_DIMS)
  };

  let loaded_image = LoadedImage {
    actual_dims: actual_dims,
    texture_data: texture_data,
  };

  // decode image

  let decode_time = run_start.elapsed();
  timing.image_decode_ms = decode_time.as_secs_f64() * 1000.0;

  let gpu_setup_start = std::time::Instant::now();

  let mut image_pipeline = config.build_pipeline();

  let mut texture_data = loaded_image.texture_data;
  let mut actual_dims = loaded_image.actual_dims;

  // Initialize the pipeline with GPU resources (moved device and queue so we need to recreate them)
  let instance = wgpu::Instance::default();
  let adapter = instance
    .request_adapter(&wgpu::RequestAdapterOptions::default())
    .await
    .unwrap();

  let (device, queue) = adapter
    .request_device(&wgpu::DeviceDescriptor {
      label: None,
      required_features: wgpu::Features::empty(),
      required_limits: wgpu::Limits::defaults(),
      memory_hints: wgpu::MemoryHints::MemoryUsage,
      trace: wgpu::Trace::Off,
    })
    .await
    .unwrap();

  image_pipeline.init_gpu(device.clone(), queue.clone());

  let gpu_setup_time = gpu_setup_start.elapsed();
  timing.gpu_setup_ms = gpu_setup_time.as_secs_f64() * 1000.0;
  let processing_start = std::time::Instant::now();

  // Process the image through the pipeline using actual dimensions
  // The pipeline now handles resizing as part of the processing chain
  match image_pipeline
    .process(
      texture_data.clone(),
      (actual_dims.0 as u32, actual_dims.1 as u32),
    )
    .await
  {
    Ok((processed_data, final_dimensions)) => {
      texture_data = processed_data;
      actual_dims = (final_dimensions.0 as usize, final_dimensions.1 as usize);
      log::info!(
        "Image processed through pipeline with final dimensions: {}x{}",
        actual_dims.0,
        actual_dims.1
      );
    }
    Err(e) => {
      log::error!("Pipeline processing failed: {}", e);
    }
  }

  let processing_time = processing_start.elapsed();
  timing.processing_ms = processing_time.as_secs_f64() * 1000.0;
  let output_start = std::time::Instant::now();

  // Output using final dimensions
  if let Some(output_path) = &config.output_path {
    #[cfg(not(target_arch = "wasm32"))]
    {
      let output_path_str = output_path.to_string_lossy().to_string();

      // Use standard image output for other formats
      write_image(texture_data.to_vec(), actual_dims, output_path_str);
    }
  }
  #[cfg(target_arch = "wasm32")]
  output_image_wasm(texture_data.to_vec(), actual_dims);

  let output_time = output_start.elapsed();
  let total_time = run_start.elapsed();

  timing.output_ms = output_time.as_secs_f64() * 1000.0;
  timing.total_ms = total_time.as_secs_f64() * 1000.0;

  log::info!("Done.");

  timing.print_all();

  Ok(())
}
