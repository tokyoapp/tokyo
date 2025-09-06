use crate::Library;
use crate::messages::handle_client_request;
use anyhow::Result;
use axum::Router;
use axum::extract::WebSocketUpgrade;
use axum::extract::ws;
use axum::routing::get;
use bytes::{Buf, BufMut, Bytes, BytesMut};
use futures::StreamExt;
use futures::sink::SinkExt;
use futures::stream::SplitSink;
use log::{error, info};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokyo_schema::prost::Message;

async fn hnadle_client_message(
  msg: tokyo_schema::proto::ClientMessage,
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
      let mut error_message = tokyo_schema::proto::Message::default();
      error_message.nonce = nonce;
      error_message.error = Some(true);
      error_message.message = Some(error);

      let mut msg_buf = Vec::new();
      msg_buf.reserve(tokyo_schema::proto::Message::encoded_len(&error_message));
      tokyo_schema::proto::Message::encode(&error_message, &mut msg_buf);

      sender
        .lock()
        .await
        .send(ws::Message::Binary(msg_buf))
        .await
        .expect("Error sending message");
    }
  });
}

pub async fn handle_socket(mut socket: ws::WebSocket) {
  info!("Socket connected");

  // send system info
  let mut sys_msg = tokyo_schema::proto::Message::default();
  let info_msg = tokyo_schema::proto::SystemInfo::from(Library::sysinfo().into());
  let msg = tokyo_schema::proto::message::Msg::System(info_msg);

  let mut msg_buf = Vec::new();
  msg_buf.reserve(msg.encoded_len());
  msg.encode(&mut msg_buf);

  let _ = socket.send(ws::Message::Binary(msg_buf)).await;

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

    if let Ok(msg) = tokyo_schema::proto::ClientMessage::parse_from_bytes(&data) {
      let sender = sender.clone();
      hnadle_client_message(msg, sender).await;
    } else {
      let mut error_message = tokyo_schema::proto::Message::default();
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
