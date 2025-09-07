use crate::Result;
use log::info;
use tokyo_schema::proto;

#[tauri::command(async)]
pub async fn request(message: Vec<u8>) -> Result<Vec<u8>> {
  let msg = proto::ClientMessage::try_from(message).expect("Failed to parse message");

  let res = tokyo_library::handle_client_request(msg)
    .await
    .expect("Could not handle");

  info!("Response: {:?}", res.message);

  return Ok(res.into());
}
