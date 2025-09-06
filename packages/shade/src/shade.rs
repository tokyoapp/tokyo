//! Image processing pipeline with node-based architecture
//!
//! This module provides a flexible, extensible system for image processing
//! that mimics node-based compositing software like Blender's shader editor
//! or DaVinci Resolve's node graph.

use flume;
use std::collections::HashMap;
use wgpu::util::DeviceExt;
use wgpu::{ComputePipeline, Device, Queue, Texture, TextureView};

// Always use 32-bit float for maximum quality
pub const TEXTURE_FORMAT: wgpu::TextureFormat = wgpu::TextureFormat::Rgba32Float;
pub const BYTES_PER_PIXEL: u32 = 16; // 4 channels * 4 bytes per f32
pub const SHADER_FORMAT: &str = "rgba32float";

// WebGPU buffer limits
pub const MAX_BUFFER_SIZE: u64 = 268_435_456; // 256 MB - WebGPU limit
pub const MAX_TILE_SIZE: u32 = 2048; // Maximum tile dimension for processing large images

// Define the types of processing nodes available
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum NodeType {
  // Input/Output nodes
  ImageInput,
  ImageOutput,

  // Color adjustments
  Brightness,
  Contrast,
  Saturation,
  Hue,
  Gamma,
  Levels,
  ColorBalance,
  WhiteBalance,

  // Filters
  Blur,
  Sharpen,
  Noise,

  // Transformations
  Resize,
  Crop,

  // Compositing
  Mix,
  Mask,
  Invert,
}

/// Parameters for different node types
#[derive(Debug, Clone)]
pub enum NodeParams {
  Brightness {
    value: f32,
  },
  Contrast {
    value: f32,
  },
  Saturation {
    value: f32,
  },
  Hue {
    value: f32,
  },
  Gamma {
    value: f32,
  },
  Levels {
    input_black: f32,
    input_white: f32,
    output_black: f32,
    output_white: f32,
  },
  ColorBalance {
    shadows: [f32; 3],    // RGB
    midtones: [f32; 3],   // RGB
    highlights: [f32; 3], // RGB
  },
  WhiteBalance {
    auto_adjust: bool,
    temperature: f32, // Color temperature adjustment (-1.0 to 1.0)
    tint: f32,        // Tint adjustment (-1.0 to 1.0)
  },
  Blur {
    radius: f32,
  },
  Sharpen {
    amount: f32,
  },
  Noise {
    amount: f32,
    seed: u32,
  },
  Resize {
    width: Option<u32>,
    height: Option<u32>,
  },
  Crop {
    x: u32,
    y: u32,
    width: u32,
    height: u32,
  },
  Mix {
    factor: f32,
  },
  None,
}

/// Represents a connection between two nodes
#[derive(Debug, Clone)]
pub struct Connection {
  pub from_node: usize,
  pub to_node: usize,
  pub from_output: String,
  pub to_input: String,
}

/// A single processing node in the pipeline
#[derive(Debug, Clone)]
pub struct ProcessingNode {
  pub id: usize,
  pub name: String,
  pub node_type: NodeType,
  pub params: NodeParams,
  pub enabled: bool,
  pub inputs: Vec<String>,
  pub outputs: Vec<String>,
}

impl ProcessingNode {
  pub fn new(id: usize, name: String, node_type: NodeType) -> Self {
    let (inputs, outputs) = match node_type {
      NodeType::ImageInput => (vec![], vec!["image".to_string()]),
      NodeType::ImageOutput => (vec!["image".to_string()], vec![]),
      NodeType::Mix => (
        vec!["image1".to_string(), "image2".to_string()],
        vec!["image".to_string()],
      ),
      _ => (vec!["image".to_string()], vec!["image".to_string()]),
    };

    Self {
      id,
      name,
      node_type: node_type.clone(),
      params: Self::default_params(&node_type),
      enabled: true,
      inputs,
      outputs,
    }
  }

  fn default_params(node_type: &NodeType) -> NodeParams {
    match node_type {
      NodeType::Brightness => NodeParams::Brightness { value: 0.0 },
      NodeType::Contrast => NodeParams::Contrast { value: 1.0 },
      NodeType::Saturation => NodeParams::Saturation { value: 1.0 },
      NodeType::Hue => NodeParams::Hue { value: 0.0 },
      NodeType::Gamma => NodeParams::Gamma { value: 1.0 },
      NodeType::Levels => NodeParams::Levels {
        input_black: 0.0,
        input_white: 1.0,
        output_black: 0.0,
        output_white: 1.0,
      },
      NodeType::ColorBalance => NodeParams::ColorBalance {
        shadows: [1.0, 1.0, 1.0],
        midtones: [1.0, 1.0, 1.0],
        highlights: [1.0, 1.0, 1.0],
      },
      NodeType::WhiteBalance => NodeParams::WhiteBalance {
        auto_adjust: false,
        temperature: 0.0,
        tint: 0.0,
      },
      NodeType::Blur => NodeParams::Blur { radius: 1.0 },
      NodeType::Sharpen => NodeParams::Sharpen { amount: 1.0 },
      NodeType::Noise => NodeParams::Noise {
        amount: 0.1,
        seed: 42,
      },
      NodeType::Resize => NodeParams::Resize {
        width: None,
        height: None,
      },
      NodeType::Crop => NodeParams::Crop {
        x: 0,
        y: 0,
        width: 512,
        height: 512,
      },
      NodeType::Mix => NodeParams::Mix { factor: 0.5 },
      _ => NodeParams::None,
    }
  }

  /// Update node parameters
  pub fn set_params(&mut self, params: NodeParams) {
    self.params = params;
  }

  /// Enable or disable the node
  pub fn set_enabled(&mut self, enabled: bool) {
    self.enabled = enabled;
  }
}

/// The main image processing pipeline
pub struct ImagePipeline {
  pub nodes: HashMap<usize, ProcessingNode>,
  pub connections: Vec<Connection>,
  pub input_node_id: Option<usize>,
  pub output_node_id: Option<usize>,
  next_node_id: usize,

  // GPU resources (optional, set when initialized)
  device: Option<Device>,
  queue: Option<Queue>,
  pipelines: HashMap<NodeType, ComputePipeline>,
  textures: HashMap<usize, Texture>,
  texture_views: HashMap<usize, TextureView>,
}

impl ImagePipeline {
  /// Calculate the maximum square image dimension that can be processed without tiling.
  ///
  /// Uses binary search to find the largest dimension where the required staging buffer
  /// would not exceed MAX_BUFFER_SIZE (256MB).
  fn calculate_max_processable_dimension(&self) -> u32 {
    let bytes_per_row = |width: u32| self.aligned_bytes_per_row(width);
    let mut max_width = 1;

    // Binary search to find maximum width that fits in buffer
    let mut high = MAX_TILE_SIZE;
    while high - max_width > 1 {
      let mid = (max_width + high) / 2;
      let buffer_size = bytes_per_row(mid) as u64 * mid as u64;
      if buffer_size <= MAX_BUFFER_SIZE {
        max_width = mid;
      } else {
        high = mid;
      }
    }
    max_width
  }

  /// Determine if an image of given dimensions requires tiled processing.
  ///
  /// Returns true if the staging buffer for this image would exceed the
  /// WebGPU buffer size limit of 256MB.
  fn needs_tiling(&self, width: u32, height: u32) -> bool {
    let aligned_bytes_per_row = self.aligned_bytes_per_row(width) as u64;
    let buffer_size = aligned_bytes_per_row * height as u64;
    buffer_size > MAX_BUFFER_SIZE
  }
  /// Calculate aligned bytes per row for texture operations
  fn aligned_bytes_per_row(&self, width: u32) -> u32 {
    let unpadded_bytes_per_row = width * BYTES_PER_PIXEL;
    let align = wgpu::COPY_BYTES_PER_ROW_ALIGNMENT;
    (unpadded_bytes_per_row + align - 1) / align * align
  }

  pub fn new() -> Self {
    ImagePipeline {
      nodes: HashMap::new(),
      connections: Vec::new(),
      input_node_id: None,
      output_node_id: None,
      next_node_id: 0,
      device: None,
      queue: None,
      pipelines: HashMap::new(),
      textures: HashMap::new(),
      texture_views: HashMap::new(),
    }
  }

  /// Initialize GPU resources
  pub fn init_gpu(&mut self, device: Device, queue: Queue) {
    self.device = Some(device);
    self.queue = Some(queue);

    // Store device reference to avoid borrow checker issues
    if let Some(device) = &self.device {
      self.pipelines = self.create_compute_pipelines(device);
    }
  }

  fn create_compute_pipelines(
    &self,
    device: &Device,
  ) -> HashMap<NodeType, ComputePipeline> {
    let mut pipelines = HashMap::new();
    // Create bind group layout for image processing shaders
    let bind_group_layout =
      device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
        label: Some("Image Processing Bind Group Layout"),
        entries: &[
          // Input texture
          wgpu::BindGroupLayoutEntry {
            binding: 0,
            visibility: wgpu::ShaderStages::COMPUTE,
            ty: wgpu::BindingType::Texture {
              sample_type: wgpu::TextureSampleType::Float { filterable: false },
              view_dimension: wgpu::TextureViewDimension::D2,
              multisampled: false,
            },
            count: None,
          },
          // Output texture
          wgpu::BindGroupLayoutEntry {
            binding: 1,
            visibility: wgpu::ShaderStages::COMPUTE,
            ty: wgpu::BindingType::StorageTexture {
              access: wgpu::StorageTextureAccess::WriteOnly,
              format: TEXTURE_FORMAT,
              view_dimension: wgpu::TextureViewDimension::D2,
            },
            count: None,
          },
          // Parameters uniform buffer
          wgpu::BindGroupLayoutEntry {
            binding: 2,
            visibility: wgpu::ShaderStages::COMPUTE,
            ty: wgpu::BindingType::Buffer {
              ty: wgpu::BufferBindingType::Uniform,
              has_dynamic_offset: false,
              min_binding_size: None,
            },
            count: None,
          },
        ],
      });

    let pipeline_layout =
      device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
        label: Some("Image Processing Pipeline Layout"),
        bind_group_layouts: &[&bind_group_layout],
        push_constant_ranges: &[],
      });

    // Initialize pipelines for each node type that needs GPU processing
    let node_types_to_initialize = [
      NodeType::Brightness,
      NodeType::Contrast,
      NodeType::Saturation,
      NodeType::Hue,
      NodeType::Gamma,
      NodeType::Levels,
      NodeType::ColorBalance,
      NodeType::WhiteBalance,
      NodeType::Blur,
      NodeType::Sharpen,
      NodeType::Noise,
      NodeType::Resize,
      NodeType::Crop,
      NodeType::Mix,
      NodeType::Mask,
      NodeType::Invert,
    ];

    for node_type in &node_types_to_initialize {
      if let Some(shader_source) = self.get_shader_source_for_node_type(node_type) {
        let shader_module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
          label: Some(&format!("{:?} Shader", node_type)),
          source: wgpu::ShaderSource::Wgsl(shader_source.into()),
        });

        let pipeline = device.create_compute_pipeline(&wgpu::ComputePipelineDescriptor {
          label: Some(&format!("{:?} Pipeline", node_type)),
          layout: Some(&pipeline_layout),
          module: &shader_module,
          entry_point: Some("main"),
          compilation_options: Default::default(),
          cache: None,
        });

        pipelines.insert(*node_type, pipeline);
      }
    }

    pipelines
  }

  fn get_shader_source_for_node_type(&self, node_type: &NodeType) -> Option<String> {
    let base_shader = match node_type {
      NodeType::Brightness => Some(include_str!("shaders/brightness.wgsl")),
      NodeType::Contrast => Some(include_str!("shaders/contrast.wgsl")),
      NodeType::Saturation => Some(include_str!("shaders/saturation.wgsl")),
      NodeType::Hue => Some(include_str!("shaders/hue.wgsl")),
      NodeType::Gamma => Some(include_str!("shaders/gamma.wgsl")),
      NodeType::Levels => Some(include_str!("shaders/levels.wgsl")),
      NodeType::ColorBalance => Some(include_str!("shaders/color_balance.wgsl")),
      NodeType::WhiteBalance => Some(include_str!("shaders/white_balance.wgsl")),
      NodeType::Blur => Some(include_str!("shaders/blur.wgsl")),
      NodeType::Sharpen => Some(include_str!("shaders/sharpen.wgsl")),
      NodeType::Noise => Some(include_str!("shaders/noise.wgsl")),
      NodeType::Resize => Some(include_str!("shaders/resize.wgsl")),
      NodeType::Crop => Some(include_str!("shaders/crop.wgsl")),
      NodeType::Mix => Some(include_str!("shaders/mix.wgsl")),
      NodeType::Mask => Some(include_str!("shaders/mask.wgsl")),
      NodeType::Invert => Some(include_str!("shaders/invert.wgsl")),
      _ => None,
    }?;

    // Replace the hardcoded texture format with the dynamic one
    let shader_with_format = base_shader.replace("rgba32float", SHADER_FORMAT);
    Some(shader_with_format)
  }

  /// Add a new node to the pipeline
  pub fn add_node(&mut self, name: String, node_type: NodeType) -> usize {
    let id = self.next_node_id;
    self.next_node_id += 1;

    let node = ProcessingNode::new(id, name, node_type.clone());

    // Set input/output node references
    match node_type {
      NodeType::ImageInput => self.input_node_id = Some(id),
      NodeType::ImageOutput => self.output_node_id = Some(id),
      _ => {}
    }

    self.nodes.insert(id, node);
    id
  }

  /// Remove a node from the pipeline
  pub fn remove_node(&mut self, node_id: usize) -> Result<(), String> {
    if !self.nodes.contains_key(&node_id) {
      return Err(format!("Node {} does not exist", node_id));
    }

    // Remove all connections involving this node
    self
      .connections
      .retain(|conn| conn.from_node != node_id && conn.to_node != node_id);

    // Clear input/output references if necessary
    if self.input_node_id == Some(node_id) {
      self.input_node_id = None;
    }
    if self.output_node_id == Some(node_id) {
      self.output_node_id = None;
    }

    self.nodes.remove(&node_id);
    Ok(())
  }

  /// Connect two nodes
  pub fn connect_nodes(
    &mut self,
    from_node: usize,
    from_output: String,
    to_node: usize,
    to_input: String,
  ) -> Result<(), String> {
    // Validate nodes exist
    if !self.nodes.contains_key(&from_node) {
      return Err(format!("Source node {} does not exist", from_node));
    }
    if !self.nodes.contains_key(&to_node) {
      return Err(format!("Target node {} does not exist", to_node));
    }

    // Validate outputs and inputs exist
    let from_node_ref = &self.nodes[&from_node];
    let to_node_ref = &self.nodes[&to_node];

    if !from_node_ref.outputs.contains(&from_output) {
      return Err(format!(
        "Output '{}' does not exist on node {}",
        from_output, from_node
      ));
    }
    if !to_node_ref.inputs.contains(&to_input) {
      return Err(format!(
        "Input '{}' does not exist on node {}",
        to_input, to_node
      ));
    }

    // Check for cycles (basic check)
    if self.would_create_cycle(from_node, to_node) {
      return Err("Connection would create a cycle".to_string());
    }

    // Remove existing connection to the same input
    self
      .connections
      .retain(|conn| !(conn.to_node == to_node && conn.to_input == to_input));

    // Add new connection
    self.connections.push(Connection {
      from_node,
      to_node,
      from_output,
      to_input,
    });

    Ok(())
  }

  /// Basic cycle detection
  fn would_create_cycle(&self, from: usize, to: usize) -> bool {
    // Simple check: if 'to' can reach 'from', adding this connection creates a cycle
    self.can_reach(to, from)
  }

  /// Check if one node can reach another through connections
  fn can_reach(&self, from: usize, target: usize) -> bool {
    if from == target {
      return true;
    }

    for conn in &self.connections {
      if conn.from_node == from && self.can_reach(conn.to_node, target) {
        return true;
      }
    }
    false
  }

  /// Get execution order using topological sort
  pub fn get_execution_order(&self) -> Result<Vec<usize>, String> {
    let mut in_degree: HashMap<usize, usize> = HashMap::new();
    let mut graph: HashMap<usize, Vec<usize>> = HashMap::new();

    // Initialize
    for &node_id in self.nodes.keys() {
      in_degree.insert(node_id, 0);
      graph.insert(node_id, Vec::new());
    }

    // Build graph and count in-degrees
    for conn in &self.connections {
      graph.entry(conn.from_node).or_default().push(conn.to_node);
      *in_degree.entry(conn.to_node).or_default() += 1;
    }

    // Topological sort
    let mut queue: Vec<usize> = in_degree
      .iter()
      .filter(|(_, degree)| **degree == 0)
      .map(|(node_id, _)| *node_id)
      .collect();

    let mut result = Vec::new();

    while let Some(node_id) = queue.pop() {
      result.push(node_id);

      if let Some(neighbors) = graph.get(&node_id) {
        for &neighbor in neighbors {
          if let Some(degree) = in_degree.get_mut(&neighbor) {
            *degree -= 1;
            if *degree == 0 {
              queue.push(neighbor);
            }
          }
        }
      }
    }

    if result.len() != self.nodes.len() {
      return Err("Cycle detected in pipeline".to_string());
    }

    Ok(result)
  }

  /// Process the entire pipeline
  pub async fn process(
    &mut self,
    input_data: Vec<u8>,
    dimensions: (u32, u32),
  ) -> Result<(Vec<u8>, (u32, u32)), String> {
    let execution_order = self.get_execution_order()?;

    if let (Some(device), Some(queue)) = (self.device.as_ref(), self.queue.as_ref()) {
      // Create input texture and upload data
      let mut current_data = input_data.clone();
      let mut current_dimensions = dimensions;

      log::info!("Processing pipeline with {} nodes", execution_order.len());

      for &node_id in &execution_order {
        if let Some(node) = self.nodes.get(&node_id) {
          if node.enabled {
            log::info!("Processing node: {} ({})", node.name, node.id);

            // Skip ImageInput and ImageOutput nodes as they don't need GPU processing
            if matches!(node.node_type, NodeType::ImageInput | NodeType::ImageOutput) {
              continue;
            }

            // Process the node if we have a pipeline for it
            if let Some(pipeline) = self.pipelines.get(&node.node_type) {
              let (width, height) = current_dimensions;
              if self.needs_tiling(width, height)
                && !matches!(node.node_type, NodeType::Resize)
              {
                log::info!(
                  "Using tiled processing for large image: {}x{}",
                  width,
                  height
                );
                current_data = self
                  .process_node_tiled(
                    device,
                    queue,
                    pipeline,
                    &node.node_type,
                    &node.params,
                    current_data,
                    current_dimensions,
                  )
                  .await?;
              } else {
                let (processed_data, new_dimensions) = self
                  .process_node_with_dimensions(
                    device,
                    queue,
                    pipeline,
                    &node.node_type,
                    &node.params,
                    current_data,
                    current_dimensions,
                  )
                  .await?;
                current_data = processed_data;
                current_dimensions = new_dimensions;
              }
            } else {
              log::warn!("No pipeline found for node type: {:?}", node.node_type);
            }
          }
        }
      }

      Ok((current_data, current_dimensions))
    } else {
      Err("GPU resources not initialized".to_string())
    }
  }

  async fn process_node_with_dimensions(
    &self,
    device: &Device,
    queue: &Queue,
    pipeline: &ComputePipeline,
    node_type: &NodeType,
    params: &NodeParams,
    input_data: Vec<u8>,
    dimensions: (u32, u32),
  ) -> Result<(Vec<u8>, (u32, u32)), String> {
    // Handle resize specially
    if let NodeType::Resize = node_type {
      return self
        .process_resize_node(device, queue, pipeline, params, input_data, dimensions)
        .await;
    }

    // For other nodes, call the original process_node method and return same dimensions
    let processed_data = self
      .process_node(
        device, queue, pipeline, node_type, params, input_data, dimensions,
      )
      .await?;
    Ok((processed_data, dimensions))
  }

  async fn process_resize_node(
    &self,
    device: &Device,
    queue: &Queue,
    pipeline: &ComputePipeline,
    params: &NodeParams,
    input_data: Vec<u8>,
    dimensions: (u32, u32),
  ) -> Result<(Vec<u8>, (u32, u32)), String> {
    let (current_width, current_height) = dimensions;

    // Extract resize parameters
    let (target_width, target_height) =
      if let NodeParams::Resize { width, height } = params {
        match (width, height) {
          (Some(w), Some(h)) => (*w, *h),
          (Some(w), None) => {
            // Maintain aspect ratio, set width
            let aspect_ratio = current_height as f32 / current_width as f32;
            let h = (*w as f32 * aspect_ratio) as u32;
            (*w, h)
          }
          (None, Some(h)) => {
            // Maintain aspect ratio, set height
            let aspect_ratio = current_width as f32 / current_height as f32;
            let w = (*h as f32 * aspect_ratio) as u32;
            (w, *h)
          }
          (None, None) => return Ok((input_data, dimensions)), // No resize needed
        }
      } else {
        return Err("Invalid parameters for resize node".to_string());
      };

    log::info!(
      "Resizing image from {}x{} to {}x{}",
      current_width,
      current_height,
      target_width,
      target_height
    );

    // Create input texture
    let input_texture = device.create_texture(&wgpu::TextureDescriptor {
      label: Some("Resize Input Texture"),
      size: wgpu::Extent3d {
        width: current_width,
        height: current_height,
        depth_or_array_layers: 1,
      },
      mip_level_count: 1,
      sample_count: 1,
      dimension: wgpu::TextureDimension::D2,
      format: TEXTURE_FORMAT,
      usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
      view_formats: &[],
    });

    // Create output texture with new dimensions
    let output_texture = device.create_texture(&wgpu::TextureDescriptor {
      label: Some("Resize Output Texture"),
      size: wgpu::Extent3d {
        width: target_width,
        height: target_height,
        depth_or_array_layers: 1,
      },
      mip_level_count: 1,
      sample_count: 1,
      dimension: wgpu::TextureDimension::D2,
      format: TEXTURE_FORMAT,
      usage: wgpu::TextureUsages::STORAGE_BINDING | wgpu::TextureUsages::COPY_SRC,
      view_formats: &[],
    });

    // Upload input data to texture
    queue.write_texture(
      wgpu::TexelCopyTextureInfo {
        texture: &input_texture,
        mip_level: 0,
        origin: wgpu::Origin3d::ZERO,
        aspect: wgpu::TextureAspect::All,
      },
      &input_data,
      wgpu::TexelCopyBufferLayout {
        offset: 0,
        bytes_per_row: Some(BYTES_PER_PIXEL * current_width),
        rows_per_image: Some(current_height),
      },
      wgpu::Extent3d {
        width: current_width,
        height: current_height,
        depth_or_array_layers: 1,
      },
    );

    // Create parameter buffer with target dimensions
    let param_data = self.serialize_params(params)?;
    let param_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
      label: Some("Resize Parameter Buffer"),
      contents: &param_data,
      usage: wgpu::BufferUsages::UNIFORM,
    });

    // Create bind group layout
    let bind_group_layout =
      device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
        label: Some("Resize Bind Group Layout"),
        entries: &[
          wgpu::BindGroupLayoutEntry {
            binding: 0,
            visibility: wgpu::ShaderStages::COMPUTE,
            ty: wgpu::BindingType::Texture {
              multisampled: false,
              view_dimension: wgpu::TextureViewDimension::D2,
              sample_type: wgpu::TextureSampleType::Float { filterable: false },
            },
            count: None,
          },
          wgpu::BindGroupLayoutEntry {
            binding: 1,
            visibility: wgpu::ShaderStages::COMPUTE,
            ty: wgpu::BindingType::StorageTexture {
              access: wgpu::StorageTextureAccess::WriteOnly,
              format: TEXTURE_FORMAT,
              view_dimension: wgpu::TextureViewDimension::D2,
            },
            count: None,
          },
          wgpu::BindGroupLayoutEntry {
            binding: 2,
            visibility: wgpu::ShaderStages::COMPUTE,
            ty: wgpu::BindingType::Buffer {
              ty: wgpu::BufferBindingType::Uniform,
              has_dynamic_offset: false,
              min_binding_size: None,
            },
            count: None,
          },
        ],
      });

    // Create bind group
    let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
      label: Some("Resize Bind Group"),
      layout: &bind_group_layout,
      entries: &[
        wgpu::BindGroupEntry {
          binding: 0,
          resource: wgpu::BindingResource::TextureView(
            &input_texture.create_view(&wgpu::TextureViewDescriptor::default()),
          ),
        },
        wgpu::BindGroupEntry {
          binding: 1,
          resource: wgpu::BindingResource::TextureView(
            &output_texture.create_view(&wgpu::TextureViewDescriptor::default()),
          ),
        },
        wgpu::BindGroupEntry {
          binding: 2,
          resource: param_buffer.as_entire_binding(),
        },
      ],
    });

    // Create command encoder and compute pass
    let mut command_encoder =
      device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
        label: Some("Resize Command Encoder"),
      });

    {
      let mut compute_pass =
        command_encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
          label: Some("Resize Compute Pass"),
          timestamp_writes: None,
        });
      compute_pass.set_bind_group(0, &bind_group, &[]);
      compute_pass.set_pipeline(pipeline);
      compute_pass.dispatch_workgroups(
        (target_width + 7) / 8,
        (target_height + 7) / 8,
        1,
      );
    }

    // Read back the result
    let unpadded_bytes_per_row = target_width * BYTES_PER_PIXEL;
    let align = wgpu::COPY_BYTES_PER_ROW_ALIGNMENT as u32;
    let padded_bytes_per_row = (unpadded_bytes_per_row + align - 1) / align * align;
    let buffer_size = padded_bytes_per_row * target_height;

    let output_buffer = device.create_buffer(&wgpu::BufferDescriptor {
      label: Some("Resize Output Buffer"),
      size: buffer_size as u64,
      usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
      mapped_at_creation: false,
    });

    command_encoder.copy_texture_to_buffer(
      wgpu::TexelCopyTextureInfo {
        texture: &output_texture,
        mip_level: 0,
        origin: wgpu::Origin3d::ZERO,
        aspect: wgpu::TextureAspect::All,
      },
      wgpu::TexelCopyBufferInfo {
        buffer: &output_buffer,
        layout: wgpu::TexelCopyBufferLayout {
          offset: 0,
          bytes_per_row: Some(padded_bytes_per_row),
          rows_per_image: Some(target_height),
        },
      },
      wgpu::Extent3d {
        width: target_width,
        height: target_height,
        depth_or_array_layers: 1,
      },
    );

    queue.submit(Some(command_encoder.finish()));

    // Map and read the buffer
    let buffer_slice = output_buffer.slice(..);
    let (sender, receiver) = flume::bounded(1);
    buffer_slice.map_async(wgpu::MapMode::Read, move |r| sender.send(r).unwrap());
    device.poll(wgpu::PollType::Wait).unwrap();
    receiver
      .recv_async()
      .await
      .map_err(|e| e.to_string())?
      .map_err(|e| e.to_string())?;

    // Copy data accounting for row padding
    let mut result_data =
      vec![0u8; (target_width * target_height * BYTES_PER_PIXEL) as usize];
    {
      let view = buffer_slice.get_mapped_range();
      for row in 0..target_height {
        let src_start = (row * padded_bytes_per_row) as usize;
        let src_end = src_start + (unpadded_bytes_per_row as usize);
        let dst_start = (row * unpadded_bytes_per_row) as usize;
        let dst_end = dst_start + (unpadded_bytes_per_row as usize);
        result_data[dst_start..dst_end].copy_from_slice(&view[src_start..src_end]);
      }
    }
    output_buffer.unmap();

    Ok((result_data, (target_width, target_height)))
  }

  async fn process_node(
    &self,
    device: &Device,
    queue: &Queue,
    pipeline: &ComputePipeline,
    _node_type: &NodeType,
    params: &NodeParams,
    input_data: Vec<u8>,
    dimensions: (u32, u32),
  ) -> Result<Vec<u8>, String> {
    let (width, height) = dimensions;

    log::info!("Texture dimensions: {:?}", dimensions);

    // Create input texture
    let input_texture = device.create_texture(&wgpu::TextureDescriptor {
      label: Some("Input Texture"),
      size: wgpu::Extent3d {
        width,
        height,
        depth_or_array_layers: 1,
      },
      mip_level_count: 1,
      sample_count: 1,
      dimension: wgpu::TextureDimension::D2,
      format: TEXTURE_FORMAT,
      usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
      view_formats: &[],
    });

    // Create output texture
    let output_texture = device.create_texture(&wgpu::TextureDescriptor {
      label: Some("Output Texture"),
      size: wgpu::Extent3d {
        width,
        height,
        depth_or_array_layers: 1,
      },
      mip_level_count: 1,
      sample_count: 1,
      dimension: wgpu::TextureDimension::D2,
      format: TEXTURE_FORMAT,
      usage: wgpu::TextureUsages::STORAGE_BINDING | wgpu::TextureUsages::COPY_SRC,
      view_formats: &[],
    });

    // Upload input data to texture
    queue.write_texture(
      wgpu::TexelCopyTextureInfo {
        texture: &input_texture,
        mip_level: 0,
        origin: wgpu::Origin3d::ZERO,
        aspect: wgpu::TextureAspect::All,
      },
      &input_data,
      wgpu::TexelCopyBufferLayout {
        offset: 0,
        bytes_per_row: Some(BYTES_PER_PIXEL * width),
        rows_per_image: Some(height),
      },
      wgpu::Extent3d {
        width,
        height,
        depth_or_array_layers: 1,
      },
    );

    // Create and upload parameter buffer
    let param_data = self.serialize_params(params)?;
    let param_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
      label: Some("Parameter Buffer"),
      contents: &param_data,
      usage: wgpu::BufferUsages::UNIFORM,
    });

    // Create bind group layout (we need to recreate this for each call)
    let bind_group_layout =
      device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
        label: Some("Processing Bind Group Layout"),
        entries: &[
          wgpu::BindGroupLayoutEntry {
            binding: 0,
            visibility: wgpu::ShaderStages::COMPUTE,
            ty: wgpu::BindingType::Texture {
              sample_type: wgpu::TextureSampleType::Float { filterable: false },
              view_dimension: wgpu::TextureViewDimension::D2,
              multisampled: false,
            },
            count: None,
          },
          wgpu::BindGroupLayoutEntry {
            binding: 1,
            visibility: wgpu::ShaderStages::COMPUTE,
            ty: wgpu::BindingType::StorageTexture {
              access: wgpu::StorageTextureAccess::WriteOnly,
              format: TEXTURE_FORMAT,
              view_dimension: wgpu::TextureViewDimension::D2,
            },
            count: None,
          },
          wgpu::BindGroupLayoutEntry {
            binding: 2,
            visibility: wgpu::ShaderStages::COMPUTE,
            ty: wgpu::BindingType::Buffer {
              ty: wgpu::BufferBindingType::Uniform,
              has_dynamic_offset: false,
              min_binding_size: None,
            },
            count: None,
          },
        ],
      });

    // Create bind group
    let bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
      label: Some("Processing Bind Group"),
      layout: &bind_group_layout,
      entries: &[
        wgpu::BindGroupEntry {
          binding: 0,
          resource: wgpu::BindingResource::TextureView(
            &input_texture.create_view(&wgpu::TextureViewDescriptor::default()),
          ),
        },
        wgpu::BindGroupEntry {
          binding: 1,
          resource: wgpu::BindingResource::TextureView(
            &output_texture.create_view(&wgpu::TextureViewDescriptor::default()),
          ),
        },
        wgpu::BindGroupEntry {
          binding: 2,
          resource: param_buffer.as_entire_binding(),
        },
      ],
    });

    // Create staging buffer for reading back result with aligned row size
    let aligned_bytes_per_row = self.aligned_bytes_per_row(width);
    let staging_buffer = device.create_buffer(&wgpu::BufferDescriptor {
      label: Some("Staging Buffer"),
      size: (aligned_bytes_per_row * height) as u64,
      usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
      mapped_at_creation: false,
    });

    log::info!("Execute compute shader");

    // Execute compute shader
    let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
      label: Some("Processing Command Encoder"),
    });

    {
      let mut compute_pass = encoder.begin_compute_pass(&wgpu::ComputePassDescriptor {
        label: Some("Processing Compute Pass"),
        timestamp_writes: None,
      });
      compute_pass.set_pipeline(pipeline);
      compute_pass.set_bind_group(0, &bind_group, &[]);

      // Dispatch with 8x8 workgroup size
      let workgroup_size = 8;
      let dispatch_x = (width + workgroup_size - 1) / workgroup_size;
      let dispatch_y = (height + workgroup_size - 1) / workgroup_size;
      compute_pass.dispatch_workgroups(dispatch_x, dispatch_y, 1);
    }

    log::info!("Copy to staging buffer");

    // Copy result to staging buffer
    encoder.copy_texture_to_buffer(
      wgpu::TexelCopyTextureInfo {
        texture: &output_texture,
        mip_level: 0,
        origin: wgpu::Origin3d::ZERO,
        aspect: wgpu::TextureAspect::All,
      },
      wgpu::TexelCopyBufferInfo {
        buffer: &staging_buffer,
        layout: wgpu::TexelCopyBufferLayout {
          offset: 0,
          bytes_per_row: Some(self.aligned_bytes_per_row(width)),
          rows_per_image: Some(height),
        },
      },
      wgpu::Extent3d {
        width,
        height,
        depth_or_array_layers: 1,
      },
    );

    queue.submit(Some(encoder.finish()));

    log::info!("Copying data back to memory");

    // Read back result
    let buffer_slice = staging_buffer.slice(..);
    let (sender, receiver) = flume::bounded(1);
    buffer_slice.map_async(wgpu::MapMode::Read, move |r| sender.send(r).unwrap());
    device.poll(wgpu::PollType::Wait).unwrap();
    receiver
      .recv_async()
      .await
      .unwrap()
      .map_err(|e| format!("Buffer mapping failed: {:?}", e))?;

    let data = buffer_slice.get_mapped_range();

    // Handle row padding when copying data back
    let unpadded_bytes_per_row = width * BYTES_PER_PIXEL;
    let aligned_bytes_per_row = self.aligned_bytes_per_row(width);
    let mut result = Vec::with_capacity((unpadded_bytes_per_row * height) as usize);

    for row in 0..height {
      let src_start = (row * aligned_bytes_per_row) as usize;
      let src_end = src_start + unpadded_bytes_per_row as usize;
      result.extend_from_slice(&data[src_start..src_end]);
    }

    drop(data);
    staging_buffer.unmap();

    Ok(result)
  }

  /// Process a large image using tiled approach to avoid buffer size limits.
  ///
  /// This method splits large images into smaller tiles, processes each tile
  /// individually using the regular `process_node` method, and then reassembles
  /// the results into the final image.
  ///
  /// This approach is automatically used when an image would require a staging
  /// buffer larger than the WebGPU maximum of 256MB.
  async fn process_node_tiled(
    &self,
    device: &Device,
    queue: &Queue,
    pipeline: &ComputePipeline,
    node_type: &NodeType,
    params: &NodeParams,
    input_data: Vec<u8>,
    dimensions: (u32, u32),
  ) -> Result<Vec<u8>, String> {
    let (width, height) = dimensions;
    let max_tile_size = self.calculate_max_processable_dimension();

    log::info!(
      "Processing {}x{} image in tiles of max size {}",
      width,
      height,
      max_tile_size
    );

    // Calculate tile dimensions
    let tiles_x = (width + max_tile_size - 1) / max_tile_size;
    let tiles_y = (height + max_tile_size - 1) / max_tile_size;

    let mut result_data = vec![0u8; input_data.len()];

    for tile_y in 0..tiles_y {
      for tile_x in 0..tiles_x {
        let start_x = tile_x * max_tile_size;
        let start_y = tile_y * max_tile_size;
        let tile_width = (max_tile_size).min(width - start_x);
        let tile_height = (max_tile_size).min(height - start_y);

        log::debug!(
          "Processing tile ({}, {}): {}x{}",
          tile_x,
          tile_y,
          tile_width,
          tile_height
        );

        // Extract tile data from input
        let mut tile_data =
          Vec::with_capacity((tile_width * tile_height * BYTES_PER_PIXEL) as usize);
        for y in start_y..(start_y + tile_height) {
          let input_row_start = (y * width * BYTES_PER_PIXEL) as usize;
          let input_tile_start = input_row_start + (start_x * BYTES_PER_PIXEL) as usize;
          let input_tile_end = input_tile_start + (tile_width * BYTES_PER_PIXEL) as usize;
          tile_data.extend_from_slice(&input_data[input_tile_start..input_tile_end]);
        }

        // Process tile
        let processed_tile = self
          .process_node(
            device,
            queue,
            pipeline,
            node_type,
            params,
            tile_data,
            (tile_width, tile_height),
          )
          .await?;

        // Copy processed tile back to result
        for y in 0..tile_height {
          let result_y = start_y + y;
          let result_row_start = (result_y * width * BYTES_PER_PIXEL) as usize;
          let result_tile_start = result_row_start + (start_x * BYTES_PER_PIXEL) as usize;
          let result_tile_end =
            result_tile_start + (tile_width * BYTES_PER_PIXEL) as usize;

          let tile_row_start = (y * tile_width * BYTES_PER_PIXEL) as usize;
          let tile_row_end = tile_row_start + (tile_width * BYTES_PER_PIXEL) as usize;

          result_data[result_tile_start..result_tile_end]
            .copy_from_slice(&processed_tile[tile_row_start..tile_row_end]);
        }
      }
    }

    Ok(result_data)
  }

  fn serialize_params(&self, params: &NodeParams) -> Result<Vec<u8>, String> {
    let mut buffer = Vec::new();

    match params {
      NodeParams::Brightness { value } => {
        buffer.extend_from_slice(&value.to_le_bytes());
        // Pad to 16 bytes (uniform buffer alignment)
        buffer.resize(16, 0);
      }
      NodeParams::Contrast { value } => {
        buffer.extend_from_slice(&value.to_le_bytes());
        buffer.resize(16, 0);
      }
      NodeParams::Saturation { value } => {
        buffer.extend_from_slice(&value.to_le_bytes());
        buffer.resize(16, 0);
      }
      NodeParams::Hue { value } => {
        buffer.extend_from_slice(&value.to_le_bytes());
        buffer.resize(16, 0);
      }
      NodeParams::Gamma { value } => {
        buffer.extend_from_slice(&value.to_le_bytes());
        buffer.resize(16, 0);
      }
      NodeParams::Levels {
        input_black,
        input_white,
        output_black,
        output_white,
      } => {
        buffer.extend_from_slice(&input_black.to_le_bytes());
        buffer.extend_from_slice(&input_white.to_le_bytes());
        buffer.extend_from_slice(&output_black.to_le_bytes());
        buffer.extend_from_slice(&output_white.to_le_bytes());
      }
      NodeParams::ColorBalance {
        shadows,
        midtones,
        highlights,
      } => {
        // Pack as 3 vec3s with padding
        for &val in shadows {
          buffer.extend_from_slice(&val.to_le_bytes());
        }
        buffer.extend_from_slice(&0.0f32.to_le_bytes()); // padding
        for &val in midtones {
          buffer.extend_from_slice(&val.to_le_bytes());
        }
        buffer.extend_from_slice(&0.0f32.to_le_bytes()); // padding
        for &val in highlights {
          buffer.extend_from_slice(&val.to_le_bytes());
        }
        buffer.extend_from_slice(&0.0f32.to_le_bytes()); // padding
      }
      NodeParams::WhiteBalance {
        auto_adjust,
        temperature,
        tint,
      } => {
        buffer.extend_from_slice(&(*auto_adjust as u32 as f32).to_le_bytes());
        buffer.extend_from_slice(&temperature.to_le_bytes());
        buffer.extend_from_slice(&tint.to_le_bytes());
        buffer.extend_from_slice(&0.0f32.to_le_bytes()); // padding
      }
      NodeParams::Blur { radius } => {
        buffer.extend_from_slice(&radius.to_le_bytes());
        buffer.resize(16, 0);
      }
      NodeParams::Sharpen { amount } => {
        buffer.extend_from_slice(&amount.to_le_bytes());
        buffer.resize(16, 0);
      }
      NodeParams::Noise { amount, seed } => {
        buffer.extend_from_slice(&amount.to_le_bytes());
        buffer.extend_from_slice(&(*seed as f32).to_le_bytes());
        buffer.resize(16, 0);
      }
      NodeParams::Resize { width, height } => {
        buffer.extend_from_slice(&width.unwrap_or(0).to_le_bytes());
        buffer.extend_from_slice(&height.unwrap_or(0).to_le_bytes());
        buffer.resize(16, 0);
      }
      NodeParams::Crop {
        x,
        y,
        width,
        height,
      } => {
        buffer.extend_from_slice(&(*x as f32).to_le_bytes());
        buffer.extend_from_slice(&(*y as f32).to_le_bytes());
        buffer.extend_from_slice(&(*width as f32).to_le_bytes());
        buffer.extend_from_slice(&(*height as f32).to_le_bytes());
      }
      NodeParams::Mix { factor } => {
        buffer.extend_from_slice(&factor.to_le_bytes());
        buffer.resize(16, 0);
      }
      NodeParams::None => {
        // Just add a dummy float for shaders that don't need parameters
        buffer.extend_from_slice(&0.0f32.to_le_bytes());
        buffer.resize(16, 0);
      }
    }

    Ok(buffer)
  }

  /// Get node by ID
  pub fn get_node(&self, node_id: usize) -> Option<&ProcessingNode> {
    self.nodes.get(&node_id)
  }

  /// Get mutable node by ID
  pub fn get_node_mut(&mut self, node_id: usize) -> Option<&mut ProcessingNode> {
    self.nodes.get_mut(&node_id)
  }

  /// List all nodes
  pub fn list_nodes(&self) -> Vec<&ProcessingNode> {
    self.nodes.values().collect()
  }

  /// Clear the entire pipeline
  pub fn clear(&mut self) {
    self.nodes.clear();
    self.connections.clear();
    self.input_node_id = None;
    self.output_node_id = None;
    self.next_node_id = 0;
  }

  /// Validate the pipeline
  pub fn validate(&self) -> Result<(), String> {
    // Check for input and output nodes
    if self.input_node_id.is_none() {
      return Err("Pipeline must have an input node".to_string());
    }
    if self.output_node_id.is_none() {
      return Err("Pipeline must have an output node".to_string());
    }

    // Check execution order (also validates no cycles)
    self.get_execution_order()?;

    Ok(())
  }
}

impl Default for ImagePipeline {
  fn default() -> Self {
    Self::new()
  }
}

/// Builder pattern for creating common pipeline configurations
pub struct PipelineBuilder {
  pipeline: ImagePipeline,
}

impl PipelineBuilder {
  pub fn new() -> Self {
    PipelineBuilder {
      pipeline: ImagePipeline::new(),
    }
  }

  /// Add a blur filter to the pipeline
  pub fn with_blur(mut self, radius: f32) -> Self {
    let blur_id = self.pipeline.add_node("Blur".to_string(), NodeType::Blur);
    if let Some(node) = self.pipeline.get_node_mut(blur_id) {
      node.set_params(NodeParams::Blur { radius });
    }
    self
  }

  /// Build the final pipeline
  pub fn build(self) -> ImagePipeline {
    self.pipeline
  }
}

impl Default for PipelineBuilder {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_node_creation() {
    let node = ProcessingNode::new(0, "Test".to_string(), NodeType::Brightness);
    assert_eq!(node.id, 0);
    assert_eq!(node.name, "Test");
    assert_eq!(node.node_type, NodeType::Brightness);
    assert!(node.enabled);
  }

  #[test]
  fn test_pipeline_creation() {
    let mut pipeline = ImagePipeline::new();
    let node_id = pipeline.add_node("Test".to_string(), NodeType::Brightness);
    assert_eq!(node_id, 0);
    assert!(pipeline.nodes.contains_key(&0));
  }

  #[test]
  fn test_node_connection() {
    let mut pipeline = ImagePipeline::new();
    let input_id = pipeline.add_node("Input".to_string(), NodeType::ImageInput);
    let output_id = pipeline.add_node("Output".to_string(), NodeType::ImageOutput);

    let result = pipeline.connect_nodes(
      input_id,
      "image".to_string(),
      output_id,
      "image".to_string(),
    );

    assert!(result.is_ok());
    assert_eq!(pipeline.connections.len(), 1);
  }

  #[test]
  fn test_execution_order() {
    let mut pipeline = ImagePipeline::new();
    let input_id = pipeline.add_node("Input".to_string(), NodeType::ImageInput);
    let brightness_id = pipeline.add_node("Brightness".to_string(), NodeType::Brightness);
    let output_id = pipeline.add_node("Output".to_string(), NodeType::ImageOutput);

    pipeline
      .connect_nodes(
        input_id,
        "image".to_string(),
        brightness_id,
        "image".to_string(),
      )
      .unwrap();
    pipeline
      .connect_nodes(
        brightness_id,
        "image".to_string(),
        output_id,
        "image".to_string(),
      )
      .unwrap();

    let order = pipeline.get_execution_order().unwrap();
    assert_eq!(order.len(), 3);
    assert_eq!(order[0], input_id);
    assert_eq!(order[2], output_id);
  }

  #[test]
  fn test_pipeline_builder() {
    let pipeline = PipelineBuilder::new().with_blur(2.0).build();

    assert_eq!(pipeline.nodes.len(), 1);
    assert!(pipeline.input_node_id.is_none());
    assert!(pipeline.output_node_id.is_none());
  }

  #[test]
  fn test_tiling_calculation() {
    let pipeline = ImagePipeline::new();

    // Test small image (should not need tiling)
    assert!(!pipeline.needs_tiling(1024, 1024));

    // Test large image (should need tiling)
    // Calculate dimensions that would exceed MAX_BUFFER_SIZE
    let large_dimension = 5000; // This should create a buffer > 256MB
    assert!(pipeline.needs_tiling(large_dimension, large_dimension));

    // Test max processable dimension calculation
    let max_dim = pipeline.calculate_max_processable_dimension();
    assert!(max_dim > 0);
    assert!(max_dim <= MAX_TILE_SIZE);

    // Verify that max dimension doesn't exceed buffer size
    let aligned_bytes = pipeline.aligned_bytes_per_row(max_dim);
    let buffer_size = aligned_bytes as u64 * max_dim as u64;
    assert!(buffer_size <= MAX_BUFFER_SIZE);
  }
}
