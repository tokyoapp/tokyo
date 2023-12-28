use axum::Router;
use axum::{
  extract::ws::{WebSocket, WebSocketUpgrade},
  routing::get,
};
use libsql::{params, Database, Statement};
use std::env;
use std::sync::{Arc, Mutex};

#[tokio::main(flavor = "current_thread")]
async fn main() {
  let router = Router::new().route(
    "/ws",
    get(|ws: WebSocketUpgrade| async { ws.on_upgrade(move |socket| handle_socket(socket)) }),
  );

  println!("Running app on http://0.0.0.0:8000");

  axum::Server::bind(&"0.0.0.0:8000".parse().unwrap())
    .serve(router.into_make_service())
    .await
    .unwrap();
}

async fn handle_socket(mut socket: WebSocket) {
  // Process incoming messages
  while let Some(msg) = socket.recv().await {
    tokio::spawn(async {
      let db = Database::open(
        url::Url::parse(env::var("DATABASE").expect("No Database set").as_str()).unwrap(),
      )
      .unwrap();
      let con = db.connect().unwrap();

      con
        .execute(
          "create table if not exists locations (id TEXT PRIMARY KEY, name TEXT, path TEXT);",
          params![],
        )
        .await
        .unwrap();
    });
  }
}
