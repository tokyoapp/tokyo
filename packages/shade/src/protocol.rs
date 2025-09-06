use serde::{Deserialize, Serialize};
use wgpu::hal::Attachment;
use std::collections::HashMap;
use std::io::{self, BufRead, BufReader, Read, Write};
use tokio::io::{
  AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader as TokioBufReader,
};

use crate::cli::OperationType;

/// # Usage Example: Process Image and Retrieve as Blob
///
/// This example shows the typical workflow for processing an image and then
/// retrieving the processed result as a binary blob:
///
/// ```rust,no_run
/// use serde_json::json;
/// use shade::protocol::{Message, ProcessImageParams, ImageInput, OperationSpec, GetAttachmentParams};
///
/// // 1. First, process an image
/// let process_request = Message::new_request(1, "process_image".to_string(), json!({
///     "image": {"File": {"path": "input.jpg"}},
///     "operations": [
///         {"operation": "brightness", "params": 1.2},
///         {"operation": "contrast", "params": 1.1}
///     ],
///     "output_format": "png"
/// }));
///
/// // The server responds with ProcessImageResult containing image_attachment_id
/// // Response: {"result": {"image_attachment_id": "processed_image", "width": 1920, "height": 1080, "format": "png"}}
///
/// // 2. Then, retrieve the processed image as a blob
/// let get_attachment_request = Message::new_request(2, "get_attachment".to_string(), json!({
///     "attachment_id": "processed_image"
/// }));
///
/// // The server responds with the binary data and metadata
/// // Response includes both JSON result and binary attachment
/// ```

/// Message ID for request/response correlation
pub type MessageId = u64;

/// Binary attachment metadata
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BinaryAttachment {
  pub id: String,
  pub content_type: String,
  pub size: usize,
}

/// Base structure for all messages following LSP-style protocol
#[derive(Debug, Serialize, Deserialize)]
pub struct Message {
  pub jsonrpc: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub id: Option<MessageId>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub method: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub params: Option<serde_json::Value>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub result: Option<serde_json::Value>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub error: Option<ResponseError>,
  #[serde(skip_serializing_if = "Vec::is_empty", default)]
  pub binary_attachments: Vec<BinaryAttachment>,
}

/// Error response structure
#[derive(Debug, Serialize, Deserialize)]
pub struct ResponseError {
  pub code: i32,
  pub message: String,
  pub data: Option<serde_json::Value>,
}

/// Standard error codes (following LSP convention)
pub mod error_codes {
  pub const PARSE_ERROR: i32 = -32700;
  pub const INVALID_REQUEST: i32 = -32600;
  pub const METHOD_NOT_FOUND: i32 = -32601;
  pub const INVALID_PARAMS: i32 = -32602;
  pub const INTERNAL_ERROR: i32 = -32603;
  pub const SERVER_ERROR_START: i32 = -32099;
  pub const SERVER_ERROR_END: i32 = -32000;
}

/// Image processing request parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessImageParams {
  /// Input image data as base64 string or file path
  pub image: ImageInput,
  /// Pipeline operations to apply
  pub operations: Vec<OperationSpec>,
  /// Output format (optional, defaults to "png")
  pub output_format: Option<String>,
}

/// Input image specification
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ImageInput {
  #[serde(rename = "file")]
  File { path: String },
  #[serde(rename = "base64")]
  Base64 { data: String },
  #[serde(rename = "blob")]
  Blob { data: Vec<u8> },
}

/// Operation specification for image processing
#[derive(Debug, Serialize, Deserialize)]
pub struct OperationSpec {
  pub operation: String,
  pub params: serde_json::Value,
}

/// Image processing response result
#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessImageResult {
  /// Reference to binary attachment containing image data
  pub image_attachment_id: String,
  /// Image dimensions
  pub width: u32,
  pub height: u32,
  /// Output format
  pub format: String,
}

/// Server capabilities
#[derive(Debug, Serialize, Deserialize)]
pub struct ServerCapabilities {
  pub supported_operations: Vec<String>,
  pub supported_input_formats: Vec<String>,
  pub supported_output_formats: Vec<String>,
  pub supported_methods: Vec<String>,
}

/// Initialize request parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct InitializeParams {
  pub client_info: Option<ClientInfo>,
}

/// Client information
#[derive(Debug, Serialize, Deserialize)]
pub struct ClientInfo {
  pub name: String,
  pub version: Option<String>,
}

/// Initialize response result
#[derive(Debug, Serialize, Deserialize)]
pub struct InitializeResult {
  pub capabilities: ServerCapabilities,
  pub server_info: Option<ServerInfo>,
}

/// Server information
#[derive(Debug, Serialize, Deserialize)]
pub struct ServerInfo {
  pub name: String,
  pub version: Option<String>,
}

/// Get attachment request parameters
///
/// Used to request a previously stored binary attachment (typically a processed image)
/// by its attachment ID. The attachment ID is usually obtained from a previous
/// process_image response.
#[derive(Debug, Serialize, Deserialize)]
pub struct GetAttachmentParams {
  /// The unique identifier for the attachment to retrieve
  pub attachment_id: String,
}

/// Get attachment response result
///
/// Contains metadata about the retrieved attachment. The actual binary data
/// is sent separately as a binary attachment in the message.
#[derive(Debug, Serialize, Deserialize)]
pub struct GetAttachmentResult {
  /// The attachment identifier that was requested
  pub attachment_id: String,
  /// MIME type of the attachment (e.g., "image/png", "image/jpeg")
  pub content_type: String,
  /// Size of the attachment in bytes
  pub size: usize,
}

impl Message {
  /// Create a new request message
  pub fn new_request(id: MessageId, method: String, params: serde_json::Value) -> Self {
    Self {
      jsonrpc: "2.0".to_string(),
      id: Some(id),
      method: Some(method),
      params: Some(params),
      result: None,
      error: None,
      binary_attachments: Vec::new(),
    }
  }

  /// Create a new response message
  pub fn new_response(id: MessageId, result: serde_json::Value) -> Self {
    Self {
      jsonrpc: "2.0".to_string(),
      id: Some(id),
      method: None,
      params: None,
      result: Some(result),
      error: None,
      binary_attachments: Vec::new(),
    }
  }

  /// Create a new response message with binary attachments
  pub fn new_response_with_binary(
    id: MessageId,
    result: serde_json::Value,
    attachments: Vec<BinaryAttachment>,
  ) -> Self {
    Self {
      jsonrpc: "2.0".to_string(),
      id: Some(id),
      method: None,
      params: None,
      result: Some(result),
      error: None,
      binary_attachments: attachments,
    }
  }

  /// Create a new error response
  pub fn new_error_response(id: Option<MessageId>, error: ResponseError) -> Self {
    Self {
      jsonrpc: "2.0".to_string(),
      id,
      method: None,
      params: None,
      result: None,
      error: Some(error),
      binary_attachments: Vec::new(),
    }
  }

  /// Create a notification (request without ID)
  pub fn new_notification(method: String, params: serde_json::Value) -> Self {
    Self {
      jsonrpc: "2.0".to_string(),
      id: None,
      method: Some(method),
      params: Some(params),
      result: None,
      error: None,
      binary_attachments: Vec::new(),
    }
  }
}

impl ResponseError {
  pub fn new(code: i32, message: String) -> Self {
    Self {
      code,
      message,
      data: None,
    }
  }

  pub fn with_data(code: i32, message: String, data: serde_json::Value) -> Self {
    Self {
      code,
      message,
      data: Some(data),
    }
  }

  pub fn parse_error() -> Self {
    Self::new(error_codes::PARSE_ERROR, "Parse error".to_string())
  }

  pub fn invalid_request() -> Self {
    Self::new(error_codes::INVALID_REQUEST, "Invalid request".to_string())
  }

  pub fn method_not_found(method: &str) -> Self {
    Self::new(
      error_codes::METHOD_NOT_FOUND,
      format!("Method not found: {}", method),
    )
  }

  pub fn invalid_params(message: String) -> Self {
    Self::new(error_codes::INVALID_PARAMS, message)
  }

  pub fn internal_error(message: String) -> Self {
    Self::new(error_codes::INTERNAL_ERROR, message)
  }
}

/// Convert OperationSpec to OperationType
impl TryFrom<&OperationSpec> for OperationType {
  type Error = String;

  fn try_from(spec: &OperationSpec) -> Result<Self, Self::Error> {
    match spec.operation.as_str() {
      "brightness" => {
        let value: f32 = serde_json::from_value(spec.params.clone())
          .map_err(|e| format!("Invalid brightness parameter: {}", e))?;
        Ok(OperationType::Brightness(value))
      }
      "contrast" => {
        let value: f32 = serde_json::from_value(spec.params.clone())
          .map_err(|e| format!("Invalid contrast parameter: {}", e))?;
        Ok(OperationType::Contrast(value))
      }
      "saturation" => {
        let value: f32 = serde_json::from_value(spec.params.clone())
          .map_err(|e| format!("Invalid saturation parameter: {}", e))?;
        Ok(OperationType::Saturation(value))
      }
      "hue" => {
        let value: f32 = serde_json::from_value(spec.params.clone())
          .map_err(|e| format!("Invalid hue parameter: {}", e))?;
        Ok(OperationType::Hue(value))
      }
      "gamma" => {
        let value: f32 = serde_json::from_value(spec.params.clone())
          .map_err(|e| format!("Invalid gamma parameter: {}", e))?;
        Ok(OperationType::Gamma(value))
      }
      "white_balance" => {
        #[derive(Deserialize)]
        struct WhiteBalanceParams {
          auto_adjust: Option<bool>,
          temperature: Option<f32>,
          tint: Option<f32>,
        }
        let params: WhiteBalanceParams = serde_json::from_value(spec.params.clone())
          .map_err(|e| format!("Invalid white_balance parameters: {}", e))?;
        Ok(OperationType::WhiteBalance {
          auto_adjust: params.auto_adjust.unwrap_or(false),
          temperature: params.temperature,
          tint: params.tint,
        })
      }
      "blur" => {
        let value: f32 = serde_json::from_value(spec.params.clone())
          .map_err(|e| format!("Invalid blur parameter: {}", e))?;
        Ok(OperationType::Blur(value))
      }
      "sharpen" => {
        let value: f32 = serde_json::from_value(spec.params.clone())
          .map_err(|e| format!("Invalid sharpen parameter: {}", e))?;
        Ok(OperationType::Sharpen(value))
      }
      "noise" => {
        let value: f32 = serde_json::from_value(spec.params.clone())
          .map_err(|e| format!("Invalid noise parameter: {}", e))?;
        Ok(OperationType::Noise(value))
      }
      "resize" => {
        #[derive(serde::Deserialize)]
        struct ResizeParams {
          width: Option<u32>,
          height: Option<u32>,
        }
        let params: ResizeParams = serde_json::from_value(spec.params.clone())
          .map_err(|e| format!("Invalid resize parameters: {}", e))?;
        Ok(OperationType::Resize {
          width: params.width,
          height: params.height,
        })
      }

      _ => Err(format!("Unknown operation: {}", spec.operation)),
    }
  }
}

/// Message with optional binary data
pub struct MessageWithBinary {
  pub message: Message,
  pub binary_data: HashMap<String, Vec<u8>>,
}

/// Message transport layer for reading/writing line-delimited JSON messages
pub struct MessageTransport<R, W> {
  reader: BufReader<R>,
  writer: W,
}

impl<R: Read, W: Write> MessageTransport<R, W> {
  pub fn new(reader: R, writer: W) -> Self {
    Self {
      reader: BufReader::new(reader),
      writer,
    }
  }

  /// Read a message from the input stream
  pub fn read_message(&mut self) -> io::Result<MessageWithBinary> {
    let mut line = String::new();
    let bytes_read = self.reader.read_line(&mut line)?;

    if bytes_read == 0 {
      return Err(io::Error::new(
        io::ErrorKind::UnexpectedEof,
        "Unexpected EOF while reading message",
      ));
    }

    let line = line.trim();
    if line.is_empty() {
      return Err(io::Error::new(
        io::ErrorKind::InvalidData,
        "Empty message line",
      ));
    }

    let message: Message = serde_json::from_str(line).map_err(|e| {
      io::Error::new(
        io::ErrorKind::InvalidData,
        format!("Failed to parse JSON: {}", e),
      )
    })?;

    // Read binary attachments if any
    let mut binary_data = HashMap::new();
    for attachment in &message.binary_attachments {
      let mut buffer = vec![0; attachment.size];
      self.reader.read_exact(&mut buffer)?;
      binary_data.insert(attachment.id.clone(), buffer);
    }

    Ok(MessageWithBinary {
      message,
      binary_data,
    })
  }

  /// Write a message with binary data to the output stream
  pub fn write_message(
    &mut self,
    message: &Message,
    binary_data: &HashMap<String, Vec<u8>>,
  ) -> io::Result<()> {
    log::info!("RESPONSE {:?}", message);

    let json = serde_json::to_string(message)
      .map_err(|e| io::Error::new(io::ErrorKind::Other, e))?;

    // Write a magic byte sequence to identify the start of a message
    self.writer.write_all(b"SHD")?;

    // Write the length of the JSON payload as a u64 in little-endian format
    let json_len_bytes = json.len() as u64;

    log::info!("WRITE REPSONSE; JSON LEN: {}", json_len_bytes);

    self.writer.write_all(&json_len_bytes.to_le_bytes())?;

    // Write the JSON payload
    self.writer.write_all(json.as_bytes())?;

    let attachment_count = message.binary_attachments.len();
    self.writer.write_all(&(attachment_count as u64).to_le_bytes())?;

    // Write binary attachments if any
    for attachment in &message.binary_attachments {
      if let Some(data) = binary_data.get(&attachment.id) {
        log::info!("WRITING ATTACHMENT {:?} of length {:?}", attachment.id, attachment.size);

        // Write the size of the attachment as a u64 in little-endian format
        self.writer.write_all(&(attachment.size as u64).to_le_bytes())?;
        // Write the actual binary data
        self.writer.write_all(data)?;
      }
    }

    self.writer.flush()?;
    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_message_creation() {
    let msg = Message::new_request(1, "test".to_string(), serde_json::json!({}));
    assert_eq!(msg.jsonrpc, "2.0");
    assert_eq!(msg.id, Some(1));
    assert_eq!(msg.method, Some("test".to_string()));
  }

  #[test]
  fn test_operation_conversion() {
    let spec = OperationSpec {
      operation: "brightness".to_string(),
      params: serde_json::json!(1.5),
    };

    let op: OperationType = (&spec).try_into().unwrap();
    match op {
      OperationType::Brightness(value) => assert_eq!(value, 1.5),
      _ => panic!("Wrong operation type"),
    }
  }

  #[test]
  fn test_white_balance_conversion() {
    let spec = OperationSpec {
      operation: "white_balance".to_string(),
      params: serde_json::json!({
          "auto_adjust": true,
          "temperature": 5500.0,
          "tint": 0.2
      }),
    };

    let op: OperationType = (&spec).try_into().unwrap();
    match op {
      OperationType::WhiteBalance {
        auto_adjust,
        temperature,
        tint,
      } => {
        assert!(auto_adjust);
        assert_eq!(temperature, Some(5500.0));
        assert_eq!(tint, Some(0.2));
      }
      _ => panic!("Wrong operation type"),
    }
  }

  #[test]
  fn test_message_transport() {
    use std::io::Cursor;

    // Create a test message
    let message = Message::new_request(
      42,
      "test_method".to_string(),
      serde_json::json!({"param": "value"}),
    );

    // Write message to buffer
    let mut write_buffer = Vec::new();
    {
      let cursor = Cursor::new(&mut write_buffer);
      let mut transport = MessageTransport::new(std::io::empty(), cursor);
      transport.write_message(&message, &HashMap::new()).unwrap();
    }

    // Read message back from buffer
    let read_cursor = Cursor::new(&write_buffer);
    let mut transport = MessageTransport::new(read_cursor, std::io::sink());
    let received = transport.read_message().unwrap();

    // Verify the message was correctly serialized and deserialized
    assert_eq!(received.message.jsonrpc, "2.0");
    assert_eq!(received.message.id, Some(42));
    assert_eq!(received.message.method, Some("test_method".to_string()));
    assert!(received.message.params.is_some());
    assert!(received.binary_data.is_empty());
  }

  #[test]
  fn test_line_based_protocol_example() {
    use std::io::Cursor;

    // Example showing how the new line-based protocol works
    // Each message is a single line of JSON followed by a newline

    // Sample JSON-RPC message
    let json_message = r#"{"jsonrpc":"2.0","id":1,"method":"process_image","params":{"image":{"type":"file","path":"test.jpg"},"operations":[{"operation":"brightness","params":1.2}],"output_format":"png"}}"#;

    // In the line-based protocol, messages are simply JSON lines
    let input_data = format!("{}\n", json_message);

    // Read the message
    let cursor = Cursor::new(input_data.as_bytes());
    let mut transport = MessageTransport::new(cursor, std::io::sink());
    let received = transport.read_message().unwrap();

    // Verify the message was parsed correctly
    assert_eq!(received.message.jsonrpc, "2.0");
    assert_eq!(received.message.id, Some(1));
    assert_eq!(received.message.method, Some("process_image".to_string()));
    assert!(received.message.params.is_some());

    // The protocol is now much simpler:
    // - No Content-Length headers required
    // - Each message is a single line of JSON
    // - Binary attachments still follow after the JSON line
    // - Easy to debug and implement in any language
  }

  #[test]
  fn test_get_attachment_params_serialization() {
    let params = GetAttachmentParams {
      attachment_id: "processed_image_123".to_string(),
    };

    let serialized = serde_json::to_value(params).unwrap();
    let expected = serde_json::json!({
      "attachment_id": "processed_image_123"
    });

    assert_eq!(serialized, expected);

    // Test deserialization
    let deserialized: GetAttachmentParams = serde_json::from_value(expected).unwrap();
    assert_eq!(deserialized.attachment_id, "processed_image_123");
  }

  #[test]
  fn test_get_attachment_result_serialization() {
    let result = GetAttachmentResult {
      attachment_id: "processed_image_123".to_string(),
      content_type: "image/png".to_string(),
      size: 1024,
    };

    let serialized = serde_json::to_value(result).unwrap();
    let expected = serde_json::json!({
      "attachment_id": "processed_image_123",
      "content_type": "image/png",
      "size": 1024
    });

    assert_eq!(serialized, expected);

    // Test deserialization
    let deserialized: GetAttachmentResult = serde_json::from_value(expected).unwrap();
    assert_eq!(deserialized.attachment_id, "processed_image_123");
    assert_eq!(deserialized.content_type, "image/png");
    assert_eq!(deserialized.size, 1024);
  }
}
