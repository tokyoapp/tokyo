use anyhow::Result;
use axum::Router;
use axum::{
  extract::ws::{WebSocket, WebSocketUpgrade},
  routing::get,
};
pub use libsql_client::{Client, Config, Statement};
use std::env;
use std::{fs, path::Path};

pub struct Database {
  client: Client,
}

impl Database {
  pub async fn new() -> Database {
    Database {
      client: Client::from_config(Config {
        url: url::Url::parse(env::var("DATABASE").expect("No Database set").as_str()).unwrap(),
        auth_token: env::var("TURSO_AUTH_TOKEN").ok(),
      })
      .await
      .expect("Failed to create db client"),
    }
  }

  pub async fn init_db(&self) -> Result<()> {
    if !Path::exists(&Path::new("./data/")) {
      fs::create_dir("./data/").expect("Unable to create dir './data/'");
    }

    self
      .client
      .batch([Statement::from(
        "create table if not exists locations (id TEXT PRIMARY KEY, name TEXT, path TEXT);",
      )])
      .await?;

    return Ok(());
  }
}

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
  println!("Socket connected");

  let (sender, mut receiver) = socket.split();

  // Process incoming messages
  while let Some(msg) = receiver.next().await {
    let msg = if let Ok(msg) = msg {
      msg
    } else {
      // client disconnected
      return;
    };

    let data = msg.into_data();

    tokio::spawn(async move {
      let db = Database::new().await;
      db.init_db().await;
    });
  }
}
