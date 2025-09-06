use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;
use tauri::{Manager, State};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use log;
use tokio::sync::Mutex;
use tokio::io::AsyncReadExt;
use tauri::ipc::Response;

/// JSON-RPC 2.0 Message structure
#[derive(Debug, Serialize, Deserialize)]
pub struct JsonRpcMessage {
  pub jsonrpc: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub id: Option<u64>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub method: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub params: Option<serde_json::Value>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub meta: Option<serde_json::Value>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub error: Option<JsonRpcError>,
  #[serde(skip_serializing_if = "Vec::is_empty", default)]
  pub binary_attachments: Vec<BinaryAttachment>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JsonRpcError {
  pub code: i32,
  pub message: String,
  pub data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BinaryAttachment {
  pub id: Option<String>,
  pub content_type: Option<String>,
  pub size: Option<usize>,
  pub data: Option<Vec<u8>>
}

impl BinaryAttachment {
  pub fn new(data: Vec<u8>) -> Self {
    Self {
      id: None,
      content_type: None,
      size: None,
      data: Some(data),
    }
  }
}

/// Image processing request parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessImageRequest {
  pub image: ImageInput,
  pub operations: Vec<OperationSpec>,
  pub output_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ImageInput {
  #[serde(rename = "file")]
  File { path: String },
  #[serde(rename = "base64")]
  Base64 { data: String },
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OperationSpec {
  pub operation: String,
  pub params: serde_json::Value,
}

/// Process image result
#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessImageResult {
  pub image_attachment_id: String,
  pub width: u32,
  pub height: u32,
  pub format: String,
}

/// Shade process manager
pub struct ShadeProcess {
  child: Option<Child>,
  stdin: Option<Arc<Mutex<tokio::process::ChildStdin>>>,
  message_id_counter: u64,
  pending_requests: HashMap<u64, tokio::sync::oneshot::Sender<Vec<u8>>>,
}

impl ShadeProcess {
  pub fn new() -> Self {
    Self {
      child: None,
      stdin: None,
      message_id_counter: 0,
      pending_requests: HashMap::new(),
    }
  }

  pub fn next_message_id(&mut self) -> u64 {
    self.message_id_counter += 1;
    self.message_id_counter
  }

  pub fn is_running(&self) -> bool {
    self.child.is_some()
  }

  pub fn get_stdin(&self) -> Option<Arc<Mutex<tokio::process::ChildStdin>>> {
    self.stdin.clone()
  }
}

/// Initialize the shade process
async fn start_shade_process(state: State<'_, Arc<Mutex<ShadeProcess>>>) -> Result<(), String> {
  let mut process = state.lock().await;

  if process.is_running() {
    return Ok(());
  }

  // Start the shade process in socket mode
  let mut child = Command::new("../shade/target/release/shade")
    .arg("--socket")
    .stdin(Stdio::piped())
    .stdout(Stdio::piped())
    .stderr(Stdio::inherit())
    .spawn()
    .map_err(|e| format!("Failed to start shade process: {}", e))?;

  let stdin = child.stdin.take().ok_or("Failed to get stdin")?;
  let stdout = child.stdout.take().ok_or("Failed to get stdout")?;

  // Store the handles for communication
  let stdin = Arc::new(Mutex::new(stdin));
  let stdout = Arc::new(Mutex::new(BufReader::new(stdout)));

  process.stdin = Some(stdin.clone());
  process.child = Some(child);

  // Spawn a task to handle incoming messages
  let state_clone = state.inner().clone();
  tokio::spawn(async move {
    handle_incoming_messages(stdout, state_clone).await;
    log::error!("MESSAGE READING ERROR; killed");
  });

  Ok(())
}

/// Handle incoming messages from shade process
async fn handle_incoming_messages(
  stdout: Arc<Mutex<BufReader<tokio::process::ChildStdout>>>,
  state: Arc<Mutex<ShadeProcess>>,
) {
  let mut buffer: Vec<u8> = Vec::new();
  let mut handshake_buf = [0u8; 3]; // For "SHD"
  let mut len_buf = [0u8; 8]; // For u64 length
  let mut read_valid_message = false;

  loop {
    // Lock the stdout reader for the duration of reading a full message
    let mut stdout_reader = stdout.lock().await;

    if read_valid_message {
      log::info!("WAITING FOR MESSAGE");
      read_valid_message = false;
    }

    // 1. Read the "SHADE" prefix
    if let Err(e) = stdout_reader.read_exact(&mut handshake_buf).await {
      log::error!("Failed to read handshake prefix from shade process: {}", e);
      continue;
    }

    if &handshake_buf != b"SHD" {
      continue;
    }

    log::info!("READING VALID MESSAGE");
    read_valid_message = true;

    // Read just the JSON length first
    if let Err(e) = stdout_reader.read_exact(&mut len_buf).await {
      log::error!("Failed to read JSON length from shade process: {}", e);
      continue;
    }
    let json_len = u64::from_le_bytes(len_buf);

    log::info!("MESSAGE JSON LEN {}", json_len);

    // Read the JSON section
    buffer.resize(json_len as usize, 0);

    if let Err(e) = stdout_reader.read_exact(&mut buffer).await {
      log::error!("Failed to read JSON section from shade process: {}", e);
      continue;
    }

    let json_str = match String::from_utf8(buffer.clone()) {
      Ok(s) => s,
      Err(e) => {
        log::error!("Failed to decode UTF-8 from shade process JSON: {}", e);
        continue;
      }
    };

    log::info!("MESSAGE META {:?}", json_str);

    // parse json message
    let msg = serde_json::from_str::<JsonRpcMessage>(&json_str);
    if let Err(err) = msg {
      log::error!("Failed to parse RPC meta {:?}", err);
      continue;
    }

    let mut message = msg.unwrap();

    let mut attachment_count_buf = [0u8; 8];

    // Read just the JSON length first
    if let Err(e) = stdout_reader.read_exact(&mut attachment_count_buf).await {
      log::error!("Failed to read attachment count from shade process: {}", e);
      continue;
    }
    let attachment_count = u64::from_le_bytes(attachment_count_buf);

    log::info!("ATTACHMENT COUNT {:?}", attachment_count);

    // 4. Read attachments
    if attachment_count > 0 {
      // Try to read attachment length
      let mut attachment_len_buf = [0u8; 8];

      if let Ok(bytes) = stdout_reader.read_exact(&mut attachment_len_buf).await {
        let attachment_len = u64::from_le_bytes(attachment_len_buf);

        log::info!("ATTCHMENT LEN {:?}", attachment_len);

        if attachment_len != 0 {
          let mut attachment_data = vec![0u8; attachment_len as usize];
          if let Err(e) = stdout_reader.read_exact(&mut attachment_data).await {
            log::error!("Failed to read attachment data from shade process: {}", e);
          } else {
            log::info!("Received attachment of size: {}", attachment_len);

            let first_attachment = message.binary_attachments.get_mut(0);
            if first_attachment.is_some() {
              let attchmnt: &mut BinaryAttachment = first_attachment.unwrap();
              attchmnt.data = Some(attachment_data);
            }
          }
        }
      } else {
        log::error!("Failed to read attachment length from shade process");
      }
    }

    let mut process = state.lock().await;
    if let Some(sender) = process.pending_requests.remove(&message.id.unwrap()) {
       if let Some(error) = message.error {
        log::error!("Found error in message {:?}", error);
      } else {
        // TODO: send response in bytes, dont serialize big images

        let first_attachment = message.binary_attachments.get_mut(0);

        if first_attachment.is_some() {
          let _ = sender.send(first_attachment.unwrap().data.clone().unwrap());
        }
      }
    } else {
      log::error!("Received response for unknown request ID");
    }

    // end of message
  }
}

#[tauri::command]
async fn shade(
  method: &str,
  state: State<'_, Arc<Mutex<ShadeProcess>>>,
  request: serde_json::Value,
) -> Result<Response, String> {
  let params = serde_json::to_value(request)
    .map_err(|e| format!("Failed to serialize request: {}", e))?;

  log::info!("RPC Shade Request {} {:?}", method, params);

  let (sender, receiver) = tokio::sync::oneshot::channel();
  let message_id;

  {
    let mut process = state.lock().await;
    if !process.is_running() {
      return Err("Shade process is not running".to_string());
    }

    message_id = process.next_message_id();
    process.pending_requests.insert(message_id, sender);
  }

  let message = JsonRpcMessage {
    jsonrpc: "2.0".to_string(),
    id: Some(message_id),
    method: Some(method.to_string()),
    params: Some(params),
    meta: None,
    error: None,
    binary_attachments: Vec::new(),
  };

  let json = serde_json::to_string(&message)
    .map_err(|e| format!("Failed to serialize message: {}", e))?;

  log::info!("Request {:?}", json);

  // Get stdin handle from process
  let stdin_handle = {
    let process = state.lock().await;
    process.get_stdin().ok_or("No stdin available".to_string())?
  };

  {
    let mut stdin = stdin_handle.lock().await;
    stdin.write_all(json.as_bytes()).await
      .map_err(|e| format!("Failed to write to stdin: {}", e))?;
    stdin.write_all(b"\n").await
      .map_err(|e| format!("Failed to write newline: {}", e))?;
    stdin.flush().await
      .map_err(|e| format!("Failed to flush stdin: {}", e))?;
  }

  // Wait for response with timeout
  let result = match tokio::time::timeout(std::time::Duration::from_secs(30), receiver).await {
    Ok(Ok(result)) => Ok(result),
    Ok(Err(_)) => Err("Request was cancelled".to_string()),
    Err(_) => Err("Request timed out".to_string()),
  }?;

  log::info!("SHADE RPC RESPONSE");

  Ok(tauri::ipc::Response::new(result))
}


/// Tauri command to read image file as raw bytes
///
/// This command reads an image file from the local filesystem and returns it as raw bytes.
/// This is useful for files with problematic paths (spaces, special characters) that
/// don't work well with convertFileSrc or file:// URLs.
///
/// # Arguments
/// * `file_path` - Full path to the image file
///
/// # Returns
/// * `Ok(Vec<u8>)` - Raw binary data of the image
/// * `Err(String)` - Error message if reading fails
#[tauri::command]
async fn get_image(file_path: String) -> Result<Vec<u8>, String> {
  use std::fs;

  // Read the file as binary data
  let binary_data = fs::read(&file_path)
    .map_err(|e| format!("Failed to read file '{}': {}", file_path, e))?;

  Ok(binary_data)
}

/// Tauri command to stop shade process
#[tauri::command]
async fn stop_shade(
  state: State<'_, Arc<Mutex<ShadeProcess>>>,
) -> Result<(), String> {
  let mut process = state.lock().await;
  if let Some(mut child) = process.child.take() {
    // Send shutdown message first
    if let Some(stdin_handle) = process.get_stdin() {
      let message = JsonRpcMessage {
        jsonrpc: "2.0".to_string(),
        id: None, // Notification
        method: Some("shutdown".to_string()),
        params: None,
        meta: None,
        error: None,
        binary_attachments: Vec::new(),
      };

      if let Ok(json) = serde_json::to_string(&message) {
        let mut stdin = stdin_handle.lock().await;
        let _ = stdin.write_all(json.as_bytes()).await;
        let _ = stdin.write_all(b"\n").await;
        let _ = stdin.flush().await;
      }
    }

    // Force kill if still running
    let _ = child.kill().await;
    let _ = child.wait().await;
  }
  process.stdin = None;
  process.pending_requests.clear();
  Ok(())
}

/// Tauri command to get process status and stats
#[tauri::command]
async fn shade_status(
  state: State<'_, Arc<Mutex<ShadeProcess>>>,
) -> Result<serde_json::Value, String> {
  let process = state.lock().await;
  Ok(serde_json::json!({
    "running": process.is_running(),
    "pending_requests": process.pending_requests.len(),
    "message_counter": process.message_id_counter
  }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  env_logger::builder().format_timestamp_millis().init();

  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_dialog::init())
    .manage(Arc::new(Mutex::new(ShadeProcess::new())))
    .invoke_handler(tauri::generate_handler![
      shade,
      shade_status,
      get_image,
    ])
    .setup(|app| {
      // Start the shade process on app startup
      let app_handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        let state: State<Arc<Mutex<ShadeProcess>>> = app_handle.state();
        if let Err(e) = start_shade_process(state.clone()).await {
          log::info!("Failed to start shade process: {}", e);
        }

        shade("initialize", state.clone(), serde_json::json!({ })).await;
      });
      Ok(())
    })
    .on_window_event(|window, event| {
      if let tauri::WindowEvent::CloseRequested { .. } = event {
        // Cleanup shade process on app close
        let app_handle = window.app_handle();
        let state: State<Arc<Mutex<ShadeProcess>>> = app_handle.state();
        tauri::async_runtime::block_on(async move {
          let _ = stop_shade(state).await;
        });
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
