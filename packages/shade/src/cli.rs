//! Command-line interface for the image processing pipeline
//!
//! This module provides a user-friendly CLI for creating and executing
//! image processing pipelines with various color grading and filter operations.

use crate::shade::{ImagePipeline, NodeParams, NodeType};

use clap::{Arg, ArgMatches, Command, value_parser};
use std::path::PathBuf;

/// Represents a pipeline operation with its order and parameters
#[derive(Debug, Clone)]
pub struct PipelineOperation {
  pub op_type: OperationType,
  pub index: usize,
}

/// Types of operations that can be performed in the pipeline
#[derive(Debug, Clone)]
pub enum OperationType {
  Brightness(f32),
  Contrast(f32),
  Saturation(f32),
  Hue(f32),
  Gamma(f32),
  WhiteBalance {
    auto_adjust: bool,
    temperature: Option<f32>,
    tint: Option<f32>,
  },
  Blur(f32),
  Sharpen(f32),
  Noise(f32),
  Resize {
    width: Option<u32>,
    height: Option<u32>,
  },
}

/// CLI configuration structure
#[derive(Debug)]
pub struct ProcessingConfig {
  pub input_path: Option<PathBuf>,
  pub output_path: Option<PathBuf>,
  pub pipeline_config: PipelineConfig,
  pub verbose: bool,
  pub config_path: Option<PathBuf>,
  pub clear_cache: bool,
  pub show_cache_info: bool,
}

/// Pipeline configuration from CLI arguments
#[derive(Debug)]
pub struct PipelineConfig {
  pub operations: Vec<PipelineOperation>,
}

impl Default for PipelineConfig {
  fn default() -> Self {
    Self {
      operations: Vec::new(),
    }
  }
}

impl Default for ProcessingConfig {
  fn default() -> Self {
    Self {
      input_path: None,
      output_path: None,
      pipeline_config: PipelineConfig::default(),
      verbose: false,
      config_path: None,
      clear_cache: false,
      show_cache_info: false,
    }
  }
}

impl ProcessingConfig {
  /// Parse command line arguments and create CLI configuration
  pub fn from_args() -> Result<Self, String> {
    let cli = build_cli();
    Self::from_matches(cli.get_matches())
  }

  /// Create CLI configuration from parsed matches
  fn from_matches(matches: ArgMatches) -> Result<Self, String> {
    let input_path = matches.get_one::<PathBuf>("input").cloned();
    let output_path = matches
      .get_one::<PathBuf>("output")
      .or(matches.get_one::<PathBuf>("input"))
      .cloned();
    let config_path = matches.get_one::<PathBuf>("config").cloned();

    let mut operations = Vec::new();

    // Collect operations with their indices
    if let Some(value) = matches.get_one::<f32>("brightness") {
      if let Some(indices) = matches.indices_of("brightness") {
        for index in indices {
          operations.push(PipelineOperation {
            op_type: OperationType::Brightness(*value),
            index,
          });
        }
      }
    }

    if let Some(value) = matches.get_one::<f32>("contrast") {
      if let Some(indices) = matches.indices_of("contrast") {
        for index in indices {
          operations.push(PipelineOperation {
            op_type: OperationType::Contrast(*value),
            index,
          });
        }
      }
    }

    if let Some(value) = matches.get_one::<f32>("saturation") {
      if let Some(indices) = matches.indices_of("saturation") {
        for index in indices {
          operations.push(PipelineOperation {
            op_type: OperationType::Saturation(*value),
            index,
          });
        }
      }
    }

    if let Some(value) = matches.get_one::<f32>("hue") {
      if let Some(indices) = matches.indices_of("hue") {
        for index in indices {
          operations.push(PipelineOperation {
            op_type: OperationType::Hue(*value),
            index,
          });
        }
      }
    }

    if let Some(value) = matches.get_one::<f32>("gamma") {
      if let Some(indices) = matches.indices_of("gamma") {
        for index in indices {
          operations.push(PipelineOperation {
            op_type: OperationType::Gamma(*value),
            index,
          });
        }
      }
    }

    // Handle white balance - check for any white balance related arguments
    let auto_wb = matches.get_flag("auto-white-balance");
    let wb_temp = matches.get_one::<f32>("wb-temperature").copied();
    let wb_tint = matches.get_one::<f32>("wb-tint").copied();

    if auto_wb || wb_temp.is_some() || wb_tint.is_some() {
      // Find the earliest index among white balance arguments
      let mut wb_index = usize::MAX;

      if auto_wb {
        if let Some(indices) = matches.indices_of("auto-white-balance") {
          wb_index = wb_index.min(indices.min().unwrap_or(usize::MAX));
        }
      }
      if wb_temp.is_some() {
        if let Some(indices) = matches.indices_of("wb-temperature") {
          wb_index = wb_index.min(indices.min().unwrap_or(usize::MAX));
        }
      }
      if wb_tint.is_some() {
        if let Some(indices) = matches.indices_of("wb-tint") {
          wb_index = wb_index.min(indices.min().unwrap_or(usize::MAX));
        }
      }

      if wb_index != usize::MAX {
        operations.push(PipelineOperation {
          op_type: OperationType::WhiteBalance {
            auto_adjust: auto_wb,
            temperature: wb_temp,
            tint: wb_tint,
          },
          index: wb_index,
        });
      }
    }

    if let Some(value) = matches.get_one::<f32>("blur") {
      if let Some(indices) = matches.indices_of("blur") {
        for index in indices {
          operations.push(PipelineOperation {
            op_type: OperationType::Blur(*value),
            index,
          });
        }
      }
    }

    if let Some(value) = matches.get_one::<f32>("sharpen") {
      if let Some(indices) = matches.indices_of("sharpen") {
        for index in indices {
          operations.push(PipelineOperation {
            op_type: OperationType::Sharpen(*value),
            index,
          });
        }
      }
    }

    if let Some(value) = matches.get_one::<f32>("noise") {
      if let Some(indices) = matches.indices_of("noise") {
        for index in indices {
          operations.push(PipelineOperation {
            op_type: OperationType::Noise(*value),
            index,
          });
        }
      }
    }

    // Handle resize - check for resize width or height arguments
    let resize_width = matches.get_one::<u32>("resize-width").copied();
    let resize_height = matches.get_one::<u32>("resize-height").copied();

    if resize_width.is_some() || resize_height.is_some() {
      // Find the earliest index among resize arguments
      let mut resize_index = usize::MAX;

      if resize_width.is_some() {
        if let Some(indices) = matches.indices_of("resize-width") {
          resize_index = resize_index.min(indices.min().unwrap_or(usize::MAX));
        }
      }
      if resize_height.is_some() {
        if let Some(indices) = matches.indices_of("resize-height") {
          resize_index = resize_index.min(indices.min().unwrap_or(usize::MAX));
        }
      }

      if resize_index != usize::MAX {
        operations.push(PipelineOperation {
          op_type: OperationType::Resize {
            width: resize_width,
            height: resize_height,
          },
          index: resize_index,
        });
      }
    }

    // Sort operations by their original index
    operations.sort_by_key(|op| op.index);

    let pipeline_config = PipelineConfig { operations };

    let verbose = matches.get_flag("verbose");
    let clear_cache = matches.get_flag("clear-cache");
    let show_cache_info = matches.get_flag("cache-info");

    Ok(ProcessingConfig {
      input_path,
      output_path,
      pipeline_config,
      verbose,
      config_path,
      clear_cache,
      show_cache_info,
    })
  }

  /// Build an image processing pipeline from the CLI configuration
  pub fn build_pipeline(&self) -> ImagePipeline {
    let mut pipeline = ImagePipeline::new();

    // Add input node
    let input_id = pipeline.add_node("Input".to_string(), NodeType::ImageInput);
    let mut last_node_id = input_id;

    // Add processing nodes in the order they were specified on command line
    for operation in &self.pipeline_config.operations {
      match &operation.op_type {
        OperationType::Brightness(value) => {
          let node_id = pipeline.add_node("Brightness".to_string(), NodeType::Brightness);
          if let Some(node) = pipeline.get_node_mut(node_id) {
            node.set_params(NodeParams::Brightness { value: *value });
          }
          pipeline
            .connect_nodes(
              last_node_id,
              "image".to_string(),
              node_id,
              "image".to_string(),
            )
            .expect("Failed to connect brightness node");
          last_node_id = node_id;
        }

        OperationType::Contrast(value) => {
          let node_id = pipeline.add_node("Contrast".to_string(), NodeType::Contrast);
          if let Some(node) = pipeline.get_node_mut(node_id) {
            node.set_params(NodeParams::Contrast { value: *value });
          }
          pipeline
            .connect_nodes(
              last_node_id,
              "image".to_string(),
              node_id,
              "image".to_string(),
            )
            .expect("Failed to connect contrast node");
          last_node_id = node_id;
        }

        OperationType::Saturation(value) => {
          let node_id = pipeline.add_node("Saturation".to_string(), NodeType::Saturation);
          if let Some(node) = pipeline.get_node_mut(node_id) {
            node.set_params(NodeParams::Saturation { value: *value });
          }
          pipeline
            .connect_nodes(
              last_node_id,
              "image".to_string(),
              node_id,
              "image".to_string(),
            )
            .expect("Failed to connect saturation node");
          last_node_id = node_id;
        }

        OperationType::Hue(value) => {
          let node_id = pipeline.add_node("Hue".to_string(), NodeType::Hue);
          if let Some(node) = pipeline.get_node_mut(node_id) {
            node.set_params(NodeParams::Hue { value: *value });
          }
          pipeline
            .connect_nodes(
              last_node_id,
              "image".to_string(),
              node_id,
              "image".to_string(),
            )
            .expect("Failed to connect hue node");
          last_node_id = node_id;
        }

        OperationType::Gamma(value) => {
          let node_id = pipeline.add_node("Gamma".to_string(), NodeType::Gamma);
          if let Some(node) = pipeline.get_node_mut(node_id) {
            node.set_params(NodeParams::Gamma { value: *value });
          }
          pipeline
            .connect_nodes(
              last_node_id,
              "image".to_string(),
              node_id,
              "image".to_string(),
            )
            .expect("Failed to connect gamma node");
          last_node_id = node_id;
        }

        OperationType::WhiteBalance {
          auto_adjust,
          temperature,
          tint,
        } => {
          let node_id =
            pipeline.add_node("WhiteBalance".to_string(), NodeType::WhiteBalance);
          if let Some(node) = pipeline.get_node_mut(node_id) {
            let temp = temperature.unwrap_or(0.0);
            let tint_val = tint.unwrap_or(0.0);
            node.set_params(NodeParams::WhiteBalance {
              auto_adjust: *auto_adjust,
              temperature: temp,
              tint: tint_val,
            });
          }
          pipeline
            .connect_nodes(
              last_node_id,
              "image".to_string(),
              node_id,
              "image".to_string(),
            )
            .expect("Failed to connect white balance node");
          last_node_id = node_id;
        }

        OperationType::Blur(radius) => {
          let node_id = pipeline.add_node("Blur".to_string(), NodeType::Blur);
          if let Some(node) = pipeline.get_node_mut(node_id) {
            node.set_params(NodeParams::Blur { radius: *radius });
          }
          pipeline
            .connect_nodes(
              last_node_id,
              "image".to_string(),
              node_id,
              "image".to_string(),
            )
            .expect("Failed to connect blur node");
          last_node_id = node_id;
        }

        OperationType::Sharpen(amount) => {
          let node_id = pipeline.add_node("Sharpen".to_string(), NodeType::Sharpen);
          if let Some(node) = pipeline.get_node_mut(node_id) {
            node.set_params(NodeParams::Sharpen { amount: *amount });
          }
          pipeline
            .connect_nodes(
              last_node_id,
              "image".to_string(),
              node_id,
              "image".to_string(),
            )
            .expect("Failed to connect sharpen node");
          last_node_id = node_id;
        }

        OperationType::Noise(amount) => {
          let node_id = pipeline.add_node("Noise".to_string(), NodeType::Noise);
          if let Some(node) = pipeline.get_node_mut(node_id) {
            node.set_params(NodeParams::Noise {
              amount: *amount,
              seed: 42,
            });
          }
          pipeline
            .connect_nodes(
              last_node_id,
              "image".to_string(),
              node_id,
              "image".to_string(),
            )
            .expect("Failed to connect noise node");
          last_node_id = node_id;
        }

        OperationType::Resize { width, height } => {
          let node_id = pipeline.add_node("Resize".to_string(), NodeType::Resize);
          if let Some(node) = pipeline.get_node_mut(node_id) {
            node.set_params(NodeParams::Resize {
              width: *width,
              height: *height,
            });
          }
          pipeline
            .connect_nodes(
              last_node_id,
              "image".to_string(),
              node_id,
              "image".to_string(),
            )
            .expect("Failed to connect resize node");
          last_node_id = node_id;
        }
      }
    }

    // Add output node
    let output_id = pipeline.add_node("Output".to_string(), NodeType::ImageOutput);
    pipeline
      .connect_nodes(
        last_node_id,
        "image".to_string(),
        output_id,
        "image".to_string(),
      )
      .expect("Failed to connect output node");

    pipeline
  }

  /// Print pipeline information
  pub fn print_pipeline_info(&self) {
    eprintln!("Image Processing Pipeline Configuration:");
    if let Some(input) = &self.input_path {
      eprintln!("Input:  {}", input.display());
    }
    if let Some(output) = &self.output_path {
      eprintln!("Output: {}", output.display());
    }
    eprintln!();

    if self.pipeline_config.operations.is_empty() {
      eprintln!("No operations specified - image will be passed through unchanged.");
    } else {
      eprintln!("Operations to apply (in command-line order):");
      for (i, operation) in self.pipeline_config.operations.iter().enumerate() {
        let description = match &operation.op_type {
          OperationType::Brightness(value) => format!("Brightness: {:.2}", value),
          OperationType::Contrast(value) => format!("Contrast: {:.2}", value),
          OperationType::Saturation(value) => format!("Saturation: {:.2}", value),
          OperationType::Hue(value) => format!("Hue: {:.2}°", value),
          OperationType::Gamma(value) => format!("Gamma: {:.2}", value),
          OperationType::WhiteBalance {
            auto_adjust,
            temperature,
            tint,
          } => {
            let mut parts = Vec::new();
            if *auto_adjust {
              parts.push("Auto".to_string());
            }
            if let Some(temp) = temperature {
              parts.push(format!("Temperature: {:.2}", temp));
            }
            if let Some(tint_val) = tint {
              parts.push(format!("Tint: {:.2}", tint_val));
            }
            format!("White Balance ({})", parts.join(", "))
          }
          OperationType::Blur(radius) => format!("Blur: {:.2}px", radius),
          OperationType::Sharpen(amount) => format!("Sharpen: {:.2}", amount),
          OperationType::Noise(amount) => format!("Noise: {:.2}", amount),
          OperationType::Resize { width, height } => match (width, height) {
            (Some(w), Some(h)) => format!("Resize: {}x{}", w, h),
            (Some(w), None) => format!("Resize: {}x? (maintain aspect)", w),
            (None, Some(h)) => format!("Resize: ?x{} (maintain aspect)", h),
            (None, None) => "Resize: no change".to_string(),
          },
        };
        eprintln!("  {}. {}", i + 1, description);
      }
    }
    eprintln!();
  }
}

/// Build the CLI command structure
fn build_cli() -> Command {
  Command::new("shade")
        .version("0.1.0")
        .about("GPU-accelerated image processing and color grading tool")
        .arg(
            Arg::new("list-formats")
                .long("list-formats")
                .help("List all supported image file formats and exit")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("config")
                .long("config")
                .value_name("FILE")
                .help("Path to INI configuration file")
                .required(false)
                .value_parser(value_parser!(PathBuf)),
        )
        .arg(
            Arg::new("input")
                .short('i')
                .long("input")
                .value_name("FILE")
                .help("Input image file (supports EXR, CR3/CR2/NEF/ARW/DNG, JPG/PNG/TIFF/etc)")
                .required(false)
                .value_parser(value_parser!(PathBuf)),
        )
        .arg(
            Arg::new("output")
                .short('o')
                .long("output")
                .value_name("FILE")
                .help("Output image file")
                .required(false)
                .value_parser(value_parser!(PathBuf)),
        )
        .arg(
            Arg::new("brightness")
                .short('b')
                .long("brightness")
                .value_name("VALUE")
                .help("Adjust brightness (-1.0 to 1.0, 0.0 = no change)")
                .value_parser(value_parser!(f32)),
        )
        .arg(
            Arg::new("contrast")
                .short('c')
                .long("contrast")
                .value_name("VALUE")
                .help("Adjust contrast (0.0 to 2.0, 1.0 = no change)")
                .value_parser(value_parser!(f32)),
        )
        .arg(
            Arg::new("saturation")
                .short('s')
                .long("saturation")
                .value_name("VALUE")
                .help("Adjust saturation (0.0 to 2.0, 1.0 = no change)")
                .value_parser(value_parser!(f32)),
        )
        .arg(
            Arg::new("hue")
                .short('u')
                .long("hue")
                .value_name("DEGREES")
                .help("Adjust hue (-180.0 to 180.0 degrees, 0.0 = no change)")
                .value_parser(value_parser!(f32)),
        )
        .arg(
            Arg::new("gamma")
                .short('g')
                .long("gamma")
                .value_name("VALUE")
                .help("Adjust gamma (0.1 to 3.0, 1.0 = no change)")
                .value_parser(value_parser!(f32)),
        )
        .arg(
            Arg::new("blur")
                .long("blur")
                .value_name("RADIUS")
                .help("Apply blur filter (radius in pixels)")
                .value_parser(value_parser!(f32)),
        )
        .arg(
            Arg::new("sharpen")
                .long("sharpen")
                .value_name("AMOUNT")
                .help("Apply sharpen filter (0.0 to 2.0)")
                .value_parser(value_parser!(f32)),
        )
        .arg(
            Arg::new("noise")
                .long("noise")
                .value_name("AMOUNT")
                .help("Add noise (0.0 to 1.0)")
                .value_parser(value_parser!(f32)),
        )


        .arg(
            Arg::new("auto-white-balance")
                .long("auto-white-balance")
                .help("Automatically adjust white balance")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("wb-temperature")
                .long("wb-temperature")
                .value_name("VALUE")
                .help("Manual white balance temperature (-1.0 to 1.0, 0.0 = no change)")
                .value_parser(value_parser!(f32)),
        )
        .arg(
            Arg::new("wb-tint")
                .long("wb-tint")
                .value_name("VALUE")
                .help("Manual white balance tint (-1.0 to 1.0, 0.0 = no change)")
                .value_parser(value_parser!(f32)),
        )

        .arg(
            Arg::new("resize-width")
                .long("resize-width")
                .value_name("PIXELS")
                .help("Resize output width (pixels). Use with --resize-height or alone to maintain aspect ratio")
                .value_parser(value_parser!(u32)),
        )
        .arg(
            Arg::new("resize-height")
                .long("resize-height")
                .value_name("PIXELS")
                .help("Resize output height (pixels). Use with --resize-width or alone to maintain aspect ratio")
                .value_parser(value_parser!(u32)),
        )
        .arg(
            Arg::new("verbose")
                .short('v')
                .long("verbose")
                .help("Enable verbose output")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("clear-cache")
                .long("clear-cache")
                .help("Clear the persistent raw image cache")
                .action(clap::ArgAction::SetTrue),
        )
        .arg(
            Arg::new("cache-info")
                .long("cache-info")
                .help("Show cache information (size, location)")
                .action(clap::ArgAction::SetTrue),
        )
        .after_help(
            "EXAMPLES:\n    \
            Basic image processing:\n      \
            shade -i input.jpg -o output.jpg --brightness 0.2 --contrast 1.1\n      \
            shade -i photo.png -o enhanced.png --saturation 1.3 --sharpen 0.8\n      \
            shade -i image.jpg -o blurred.jpg --blur 2.5\n      \
            shade -i portrait.jpg -o corrected.jpg --auto-white-balance\n      \
            shade -i sunset.jpg -o warmer.jpg --wb-temperature 0.3 --wb-tint -0.1\n    \
            \n    \
            Using configuration files:\n      \
            shade --config my_settings.ini  # Use custom config file\n      \
            shade  # Uses default params.ini if present, otherwise CLI args\n    \
            \n    \
            Camera Raw processing:\n      \
            shade -i IMG_1234.CR3 -o processed.jpg --brightness 0.1 --contrast 1.1\n      \
            shade -i photo.NEF -o output.tiff --auto-white-balance --sharpen 0.5\n      \
            shade -i image.ARW -o enhanced.exr  # Raw to HDR workflow\n    \
            \n    \
            Resize operations:\n      \
            shade -i large.jpg -o small.jpg --resize-width 800  # Maintain aspect ratio\n      \
            shade -i photo.png -o thumbnail.png --resize-width 300 --resize-height 200\n      \
            shade -i input.jpg -o output.jpg --resize-height 1080  # HD height, auto width\n    \
            \n    \
            Complex processing:\n      \
            shade -i original.png -o processed.png -b 0.1 -c 1.2 -s 1.1 --gamma 0.9\n    \
            \n    \
            OpenEXR HDR processing:\n      \
            shade -i input.exr -o output.exr --brightness 0.5  # Process HDR files\n      \
            shade -i hdr.exr -o display.png --gamma 2.2\n    \
            \n    \
            Format information:\n      \
            shade --list-formats  # Show all supported file types\n    \
            \n    \
            Cache management:\n      \
            shade --cache-info  # Show cache location and size\n      \
            shade --clear-cache  # Clear the persistent raw image cache\n    \
            \n    \
            High quality processing:\n      \
            shade -i input.jpg -o output.png  # Automatic format detection",
        )
}

/// Print usage examples
pub fn print_supported_formats() {
  use crate::file_loaders::get_supported_extensions;

  eprintln!("Supported Image Formats:");
  eprintln!("========================");

  let formats = get_supported_extensions();
  for (loader_name, extensions) in formats {
    eprintln!("{}: {}", loader_name, extensions.join(", "));
  }

  eprintln!("\nNotes:");
  eprintln!("- OpenEXR files support HDR/wide color gamut processing");
  eprintln!("- Camera raw files are processed with automatic development");
  eprintln!("- Standard formats are converted to 32-bit float for processing");
}

pub fn print_examples() {
  eprintln!("Usage Examples:");
  eprintln!();
  eprintln!("Using configuration files:");
  eprintln!("  shade --config my_settings.ini");
  eprintln!("  shade --config /path/to/custom.ini");
  eprintln!("  shade  # Uses default params.ini if present");
  eprintln!();
  eprintln!("Basic color grading:");
  eprintln!("  shade -i input.jpg -o output.jpg --brightness 0.2 --contrast 1.1");
  eprintln!();
  eprintln!("Enhance photo saturation and add sharpening:");
  eprintln!("  shade -i photo.png -o enhanced.png --saturation 1.3 --sharpen 0.8");
  eprintln!();
  eprintln!("Apply blur effect:");
  eprintln!("  shade -i image.jpg -o blurred.jpg --blur 2.5");
  eprintln!();
  eprintln!("White balance correction:");
  eprintln!("  shade -i portrait.jpg -o corrected.jpg --auto-white-balance");
  eprintln!();
  eprintln!("Manual white balance adjustment:");
  eprintln!("  shade -i sunset.jpg -o warmer.jpg --wb-temperature 0.3 --wb-tint -0.1");
  eprintln!();
  eprintln!("Complex processing chain:");
  eprintln!("  shade -i original.png -o processed.png \\");
  eprintln!("        --brightness 0.1 --contrast 1.2 --saturation 1.1 \\");
  eprintln!("        --gamma 0.9 --sharpen 0.5");
  eprintln!();
  eprintln!("Resize operations:");
  eprintln!(
    "  shade -i large.jpg -o small.jpg --resize-width 800  # Maintain aspect ratio"
  );
  eprintln!(
    "  shade -i photo.png -o thumbnail.png --resize-width 300 --resize-height 200"
  );
  eprintln!(
    "  shade -i input.jpg -o output.jpg --resize-height 1080  # HD height, auto width"
  );
  eprintln!();
  eprintln!("OpenEXR HDR processing:");
  eprintln!("  shade -i input.exr -o output.exr --brightness 0.5  # Process HDR files");
  eprintln!("  shade -i hdr.exr -o display.png --gamma 2.2");
  eprintln!();
  eprintln!("High quality processing:");
  eprintln!("  shade -i input.jpg -o output.png  # Automatic format detection");
  eprintln!();
}

/// Validate CLI configuration
pub fn validate_config(config: &ProcessingConfig) -> Result<(), String> {
  // Check input file exists if one is specified (skip for examples)
  if let Some(input_path) = &config.input_path {
    if !input_path.exists() {
      return Err(format!(
        "Input file does not exist: {}",
        input_path.display()
      ));
    }
  }

  // Check input file format if input path exists
  if let Some(input_path) = &config.input_path {
    let path_str = input_path.to_string_lossy();
    if !crate::file_loaders::is_supported_format_path(&path_str) {
      let ext = crate::file_loaders::get_file_extension(&path_str)
        .unwrap_or_else(|| "none".to_string());
      let supported_formats: Vec<String> =
        crate::file_loaders::get_supported_extensions()
          .into_iter()
          .flat_map(|(_, exts)| exts.into_iter().map(|e| e.to_string()))
          .collect();
      return Err(format!(
        "Unsupported input format: {} (extension: {}). Supported formats: {}",
        input_path.display(),
        ext,
        supported_formats.join(", ")
      ));
    }
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::ffi::OsString;

  #[test]
  fn test_cli_parsing() {
    let args = vec![
      OsString::from("shade"),
      OsString::from("-i"),
      OsString::from("input.jpg"),
      OsString::from("-o"),
      OsString::from("output.jpg"),
      OsString::from("--brightness"),
      OsString::from("0.2"),
      OsString::from("--contrast"),
      OsString::from("1.1"),
    ];

    let matches = build_cli().try_get_matches_from(args).unwrap();
    let config = ProcessingConfig::from_matches(matches).unwrap();

    assert_eq!(
      config.input_path.clone().unwrap(),
      PathBuf::from("input.jpg")
    );
    assert_eq!(
      config.output_path.clone().unwrap(),
      PathBuf::from("output.jpg")
    );
    // Check that operations are in the correct order
    assert_eq!(config.pipeline_config.operations.len(), 2);
    if let OperationType::Brightness(val) = config.pipeline_config.operations[0].op_type {
      assert_eq!(val, 0.2);
    } else {
      panic!("Expected brightness operation first");
    }
    if let OperationType::Contrast(val) = config.pipeline_config.operations[1].op_type {
      assert_eq!(val, 1.1);
    } else {
      panic!("Expected contrast operation second");
    }
  }

  #[test]
  fn test_pipeline_building() {
    let config = ProcessingConfig {
      input_path: Some(PathBuf::from("input.jpg")),
      output_path: Some(PathBuf::from("output.jpg")),
      pipeline_config: PipelineConfig {
        operations: vec![
          PipelineOperation {
            op_type: OperationType::Brightness(0.2),
            index: 0,
          },
          PipelineOperation {
            op_type: OperationType::Contrast(1.1),
            index: 1,
          },
          PipelineOperation {
            op_type: OperationType::Saturation(1.3),
            index: 2,
          },
        ],
      },
      verbose: false,
      config_path: None,
      clear_cache: false,
      show_cache_info: false,
    };

    let pipeline = config.build_pipeline();
    assert_eq!(pipeline.nodes.len(), 5); // Input + Brightness + Contrast + Saturation + Output
  }

  #[test]
  fn test_white_balance_cli_parsing() {
    // Test auto white balance
    let args = vec![
      OsString::from("shade"),
      OsString::from("--input"),
      OsString::from("input.jpg"),
      OsString::from("--output"),
      OsString::from("output.jpg"),
      OsString::from("--auto-white-balance"),
    ];

    let matches = build_cli().try_get_matches_from(args).unwrap();
    let config = ProcessingConfig::from_matches(matches).unwrap();

    // Check that white balance operation was added
    assert_eq!(config.pipeline_config.operations.len(), 1);
    if let OperationType::WhiteBalance {
      auto_adjust,
      temperature,
      tint,
    } = &config.pipeline_config.operations[0].op_type
    {
      assert_eq!(*auto_adjust, true);
      assert_eq!(*temperature, None);
      assert_eq!(*tint, None);
    } else {
      panic!("Expected white balance operation");
    }

    // Test manual white balance
    let args = vec![
      OsString::from("shade"),
      OsString::from("--input"),
      OsString::from("input.jpg"),
      OsString::from("--output"),
      OsString::from("output.jpg"),
      OsString::from("--wb-temperature=0.3"),
      OsString::from("--wb-tint=-0.1"),
    ];

    let matches = build_cli().try_get_matches_from(args).unwrap();
    let config = ProcessingConfig::from_matches(matches).unwrap();

    // Check that white balance operation was added
    assert_eq!(config.pipeline_config.operations.len(), 1);
    if let OperationType::WhiteBalance {
      auto_adjust,
      temperature,
      tint,
    } = &config.pipeline_config.operations[0].op_type
    {
      assert_eq!(*auto_adjust, false);
      assert_eq!(*temperature, Some(0.3));
      assert_eq!(*tint, Some(-0.1));
    } else {
      panic!("Expected white balance operation");
    }
  }

  #[test]
  fn test_white_balance_pipeline_building() {
    // Test auto white balance pipeline
    let config = ProcessingConfig {
      input_path: None,
      output_path: None,
      pipeline_config: PipelineConfig {
        operations: vec![PipelineOperation {
          op_type: OperationType::WhiteBalance {
            auto_adjust: true,
            temperature: None,
            tint: None,
          },
          index: 0,
        }],
      },
      verbose: false,
      config_path: None,
      clear_cache: false,
      show_cache_info: false,
    };

    let pipeline = config.build_pipeline();
    assert_eq!(pipeline.nodes.len(), 3); // input + white balance + output

    // Test manual white balance pipeline
    let config = ProcessingConfig {
      input_path: None,
      output_path: None,
      pipeline_config: PipelineConfig {
        operations: vec![PipelineOperation {
          op_type: OperationType::WhiteBalance {
            auto_adjust: false,
            temperature: Some(0.3),
            tint: Some(-0.1),
          },
          index: 0,
        }],
      },
      verbose: false,
      config_path: None,
      clear_cache: false,
      show_cache_info: false,
    };

    let pipeline = config.build_pipeline();
    assert_eq!(pipeline.nodes.len(), 3); // input + white balance + output
  }

  #[test]
  fn test_argument_order_respected() {
    // Test that operations are applied in command-line order
    let args = vec![
      OsString::from("shade"),
      OsString::from("--input"),
      OsString::from("input.jpg"),
      OsString::from("--output"),
      OsString::from("output.jpg"),
      OsString::from("--contrast"),
      OsString::from("1.1"),
      OsString::from("--brightness"),
      OsString::from("0.2"),
      OsString::from("--saturation"),
      OsString::from("1.3"),
    ];

    let matches = build_cli().try_get_matches_from(args).unwrap();
    let config = ProcessingConfig::from_matches(matches).unwrap();

    // Verify operations are in command-line order (contrast, brightness, saturation)
    assert_eq!(config.pipeline_config.operations.len(), 3);

    if let OperationType::Contrast(val) = config.pipeline_config.operations[0].op_type {
      assert_eq!(val, 1.1);
    } else {
      panic!(
        "Expected contrast operation first (index 0), got: {:?}",
        config.pipeline_config.operations[0].op_type
      );
    }

    if let OperationType::Brightness(val) = config.pipeline_config.operations[1].op_type {
      assert_eq!(val, 0.2);
    } else {
      panic!(
        "Expected brightness operation second (index 1), got: {:?}",
        config.pipeline_config.operations[1].op_type
      );
    }

    if let OperationType::Saturation(val) = config.pipeline_config.operations[2].op_type {
      assert_eq!(val, 1.3);
    } else {
      panic!(
        "Expected saturation operation third (index 2), got: {:?}",
        config.pipeline_config.operations[2].op_type
      );
    }

    // Verify indices are in ascending order
    assert!(
      config.pipeline_config.operations[0].index
        < config.pipeline_config.operations[1].index
    );
    assert!(
      config.pipeline_config.operations[1].index
        < config.pipeline_config.operations[2].index
    );
  }

  #[test]
  fn test_white_balance_validation() {
    // Test valid values with example (skips file validation)
    let config = ProcessingConfig {
      input_path: None,
      output_path: None,
      pipeline_config: PipelineConfig {
        ..Default::default()
      },
      verbose: false,
      config_path: None,
      clear_cache: false,
      show_cache_info: false,
    };

    assert!(validate_config(&config).is_ok());

    // Test valid config with no operations
    let config = ProcessingConfig {
      input_path: None,
      output_path: None,
      pipeline_config: PipelineConfig::default(),
      verbose: false,
      config_path: None,
      clear_cache: false,
      show_cache_info: false,
    };

    assert!(validate_config(&config).is_ok());

    // Test valid config with white balance operations
    let config = ProcessingConfig {
      input_path: None,
      output_path: None,
      pipeline_config: PipelineConfig {
        operations: vec![PipelineOperation {
          op_type: OperationType::WhiteBalance {
            auto_adjust: false,
            temperature: Some(0.5),
            tint: Some(-0.3),
          },
          index: 0,
        }],
      },
      verbose: false,
      config_path: None,
      clear_cache: false,
      show_cache_info: false,
    };

    assert!(validate_config(&config).is_ok());
  }
}
