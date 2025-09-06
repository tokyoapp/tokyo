use crate::Result;
use tokyo_schema::proto;

#[tauri::command(async)]
pub async fn request(message: Vec<u8>) -> Result<Vec<u8>> {
  let msg = proto::ClientMessage::parse_from_bytes(&message).expect("Failed to parse message");

  let res = tokyo_library::handle_client_request(msg)
    .await
    .expect("Could not handle");

  info!("Response: {:?}", res);

  return Ok(res.into());
}
