use crate::messages::handle_client_request;
use crate::Library;
use anyhow::Result;
use axum::extract::ws;
use axum::extract::WebSocketUpgrade;
use axum::routing::get;
use axum::Router;
use futures::sink::SinkExt;
use futures::stream::SplitSink;
use futures::StreamExt;
use log::{error, info};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokyo_schema::schema;
use tokyo_schema::Message;

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

pub async fn start_websocket_server() -> Result<()> {
  env_logger::init();

  Library::new().await.init().await;

  let router = Router::new().route(
    "/ws",
    get(|ws: WebSocketUpgrade| async { ws.on_upgrade(move |socket| handle_socket(socket)) }),
  );

  info!("Running app on http://127.0.0.1:8000");

  axum::Server::bind(&"127.0.0.1:8000".parse().unwrap())
    .serve(router.into_make_service())
    .await?;

  Ok(())
}
