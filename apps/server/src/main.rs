use tokyo_library::start_websocket_server;

#[tokio::main(flavor = "current_thread")]
async fn main() {
  start_websocket_server().await;
}
