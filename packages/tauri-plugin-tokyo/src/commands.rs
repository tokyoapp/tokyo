use crate::Result;
use tokyo_proto::{schema, Message};

#[tauri::command(async)]
pub async fn request(message: Vec<u8>) -> Result<Vec<u8>> {
  let msg = schema::ClientMessage::parse_from_bytes(&message).expect("Failed to parse message");

  let res = tokyo_library::handle_client_request(msg)
    .await
    .expect("Could not handle");

  info!("Response: {:?}", res);

  let bytes = res.write_to_bytes().unwrap();
  return Ok(bytes);
}
