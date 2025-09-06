use ini::Ini;
use std::path::PathBuf;

use crate::cli::{self, PipelineConfig, PipelineOperation, ProcessingConfig};

pub fn config_from_ini_path(config_path: &PathBuf) -> anyhow::Result<ProcessingConfig> {
  let conf = Ini::load_from_file(config_path)?;

  Ok(parse_ini_config(conf)?)
}

fn parse_ini_config(conf: Ini) -> anyhow::Result<ProcessingConfig> {
  let section = conf.section(Some("params")).unwrap();

  // Create pipeline config from ini values
  let mut pipeline_config = PipelineConfig::default();
  let mut operation_index = 0;

  // Parse pipeline-related parameters from ini
  if let Some(brightness) = section.get("brightness") {
    if let Ok(exp_val) = brightness.parse::<f32>() {
      pipeline_config.operations.push(PipelineOperation {
        index: operation_index,
        op_type: cli::OperationType::Brightness(exp_val),
      });
      operation_index += 1;
    }
  }

  if let Some(contrast) = section.get("contrast") {
    if let Ok(exp_val) = contrast.parse::<f32>() {
      pipeline_config.operations.push(PipelineOperation {
        index: operation_index,
        op_type: cli::OperationType::Contrast(exp_val),
      });
      operation_index += 1;
    }
  }

  if let Some(saturation) = section.get("saturation") {
    if let Ok(exp_val) = saturation.parse::<f32>() {
      pipeline_config.operations.push(PipelineOperation {
        index: operation_index,
        op_type: cli::OperationType::Saturation(exp_val),
      });
      operation_index += 1;
    }
  }

  if let Some(hue) = section.get("hue") {
    if let Ok(exp_val) = hue.parse::<f32>() {
      pipeline_config.operations.push(PipelineOperation {
        index: operation_index,
        op_type: cli::OperationType::Hue(exp_val),
      });
      operation_index += 1;
    }
  }

  if let Some(gamma) = section.get("gamma") {
    if let Ok(exp_val) = gamma.parse::<f32>() {
      pipeline_config.operations.push(PipelineOperation {
        index: operation_index,
        op_type: cli::OperationType::Gamma(exp_val),
      });
      operation_index += 1;
    }
  }

  if let Some(blur) = section.get("blur") {
    if let Ok(exp_val) = blur.parse::<f32>() {
      pipeline_config.operations.push(PipelineOperation {
        index: operation_index,
        op_type: cli::OperationType::Blur(exp_val),
      });
      operation_index += 1;
    }
  }

  if let Some(sharpen) = section.get("sharpen") {
    if let Ok(exp_val) = sharpen.parse::<f32>() {
      pipeline_config.operations.push(PipelineOperation {
        index: operation_index,
        op_type: cli::OperationType::Sharpen(exp_val),
      });
      operation_index += 1;
    }
  }

  if let Some(noise) = section.get("noise") {
    if let Ok(exp_val) = noise.parse::<f32>() {
      pipeline_config.operations.push(PipelineOperation {
        index: operation_index,
        op_type: cli::OperationType::Noise(exp_val),
      });
      operation_index += 1;
    }
  }

  // Handle white balance
  let auto_wb = section
    .get("auto_white_balance")
    .map(|v| v == "true")
    .unwrap_or(false);
  let wb_temp = section
    .get("wb_temperature")
    .and_then(|t| t.parse::<f32>().ok());
  let wb_tint = section.get("wb_tint").and_then(|t| t.parse::<f32>().ok());

  if auto_wb || wb_temp.is_some() || wb_tint.is_some() {
    pipeline_config.operations.push(PipelineOperation {
      index: operation_index,
      op_type: cli::OperationType::WhiteBalance {
        auto_adjust: auto_wb,
        temperature: wb_temp,
        tint: wb_tint,
      },
    });
    operation_index += 1;
  }

  // Handle resize
  let resize_width = section
    .get("resize_width")
    .and_then(|w| w.parse::<u32>().ok());
  let resize_height = section
    .get("resize_height")
    .and_then(|h| h.parse::<u32>().ok());

  if resize_width.is_some() || resize_height.is_some() {
    pipeline_config.operations.push(PipelineOperation {
      index: operation_index,
      op_type: cli::OperationType::Resize {
        width: resize_width,
        height: resize_height,
      },
    });
  }

  Ok(ProcessingConfig {
    input_path: section
      .get("input_path")
      .and_then(|f| Some(PathBuf::from(f.to_string()))),
    output_path: section
      .get("output_path")
      .and_then(|f| Some(PathBuf::from(f.to_string()))),
    pipeline_config,
    verbose: section.get("verbose").map(|v| v == "true").unwrap_or(false),
    config_path: None,
    clear_cache: false,
    show_cache_info: false,
  })
}
