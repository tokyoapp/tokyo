use crate::messages::handle_client_request;
use crate::Library;
use axum::extract::ws;
use futures::sink::SinkExt;
use futures::stream::SplitSink;
use futures::StreamExt;
use log::{debug, error, info, warn};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokyo_proto::schema;
use tokyo_proto::Message;

async fn hnadle_client_message(
  msg: schema::ClientMessage,
  sender: Arc<Mutex<SplitSink<ws::WebSocket, ws::Message>>>,
) {
  info!("Message: {:?}", msg);

  tokio::spawn(async move {
    let nonce = msg.nonce.clone();

    let message = handle_client_request(msg).await;

    // TODO: streamed responses
    if let Ok(mut message) = message {
      message.nonce = nonce;
      let packet = ws::Message::Binary(message.write_to_bytes().unwrap());
      sender
        .lock()
        .await
        .send(packet.clone())
        .await
        .expect("Error sending message");
    } else if let Err(message) = message {
      let error = message.to_string();
      error!("Error: {}", error);
      let mut error_message = schema::Message::new();
      error_message.nonce = nonce;
      error_message.error = Some(true);
      error_message.message = Some(error);

      sender
        .lock()
        .await
        .send(ws::Message::Binary(
          error_message
            .write_to_bytes()
            .expect("Filed to write error message."),
        ))
        .await
        .expect("Error sending message");
    }
  });
}

pub async fn handle_socket(mut socket: ws::WebSocket) {
  info!("Socket connected");

  // send system info
  let mut sys_msg = schema::Message::new();
  sys_msg.set_system(Library::sysinfo().into());
  let _ = socket
    .send(ws::Message::Binary(sys_msg.write_to_bytes().unwrap()))
    .await;

  let (sender, mut receiver) = socket.split();

  let sender = Arc::new(Mutex::new(sender));

  // Process incoming messages
  while let Some(msg) = receiver.next().await {
    let msg = if let Ok(msg) = msg {
      msg
    } else {
      // client disconnected
      return;
    };

    let data = msg.into_data();

    if let Ok(msg) = schema::ClientMessage::parse_from_bytes(&data) {
      let sender = sender.clone();
      hnadle_client_message(msg, sender).await;
    } else {
      let mut error_message = schema::Message::new();
      error_message.error = Some(true);
      error_message.message = Some("Something went wrong".to_string());

      if sender
        .lock()
        .await
        .send(ws::Message::Binary(
          error_message
            .write_to_bytes()
            .expect("Filed to write error message."),
        ))
        .await
        .is_err()
      {
        // client disconnected
        return;
      }
    }
  }
}
