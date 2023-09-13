use axum::extract::ws;
use axum::{
    extract::{
        ws::{WebSocket, WebSocketUpgrade},
        Query,
    },
    http::HeaderMap,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};

use phl_proto::generated::library;
use phl_proto::Message;

use serde::{Deserialize, Serialize};
use urlencoding::decode;

#[derive(Deserialize, Serialize)]
struct FileInfo {
    file: String,
}

#[derive(Deserialize, Serialize)]
struct LibraryInfo {
    name: String,
}

#[derive(Deserialize, Serialize)]
struct OkResponse {
    ok: bool,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/ws", get(handler))
        .route("/api/local/metadata", get(metadata))
        .route("/api/local/thumbnail", get(thumbnail))
        .route("/api/library", get(library_create))
        .route("/api/proto", get(library_list));

    println!("Running app on http://127.0.0.1:8000");

    axum::Server::bind(&"127.0.0.1:8000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn metadata(info: Query<FileInfo>) -> impl IntoResponse {
    let p = decode(&info.file).expect("UTF-8");
    let m = phl_image::metadat(p.to_string());

    let mut headers = HeaderMap::new();
    headers.insert("Access-Control-Allow-Origin", "*".parse().unwrap());
    (headers, Json(m))
}

async fn thumbnail(info: Query<FileInfo>) -> impl IntoResponse {
    let p = decode(&info.file).expect("UTF-8");

    let mut headers = HeaderMap::new();
    headers.insert("Access-Control-Allow-Origin", "*".parse().unwrap());
    headers.insert("Content-Type", "image/jpeg".parse().unwrap());
    (headers, phl_image::cached_thumb(p.to_string()))
}

async fn library_list() -> impl IntoResponse {
    phl_library::create_root_library().expect("Failed to create root library");

    let mut libs = phl_library::lib_list()
        .unwrap()
        .into_iter()
        .map(|lib| {
            let mut msg = library::LibraryMessage::new();
            msg.name = lib.name;
            msg.path = lib.path;
            msg
        })
        .collect();

    let mut list = library::LibraryListMessage::new();
    list.libraries.append(&mut libs);

    let mut msg = library::Message::new();
    msg.set_list(list);

    let mut headers = HeaderMap::new();
    headers.insert("Access-Control-Allow-Origin", "*".parse().unwrap());
    (headers, msg.write_to_bytes().unwrap())
}

async fn library_create() -> impl IntoResponse {
    phl_library::create_library("new", "/Users/tihav/Desktop");

    let mut headers = HeaderMap::new();
    headers.insert("Access-Control-Allow-Origin", "*".parse().unwrap());
    (headers, Json("{ \"ok\": true }"))
}

async fn handler(ws: WebSocketUpgrade) -> Response {
    println!("Socket connected");

    ws.on_upgrade(handle_socket)
}

fn get_index_msg() -> library::LibraryIndexMessage {
    let dir = phl_library::find_library("default").unwrap().path;
    let list = phl_library::list(dir);

    let mut index_msg = library::LibraryIndexMessage::new();
    index_msg.index = list;

    return index_msg;
}

async fn handle_socket(mut socket: WebSocket) {
    let mut msg = library::Message::new();
    msg.set_index(get_index_msg());

    socket
        .send(ws::Message::Binary(msg.write_to_bytes().unwrap()))
        .await;

    while let Some(msg) = socket.recv().await {
        let msg = if let Ok(msg) = msg {
            msg
        } else {
            // client disconnected
            return;
        };

        let data = msg.into_data();
        let msg = library::Message::parse_from_bytes(&data);

        println!("Rec socket message {:?}", msg);

        if msg.is_err() {
            let mut error_message = library::Message::new();
            error_message.error = Some(true);
            error_message.message = Some("Something went wrong".to_string());

            if socket
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

        // let ok_msg = msg.unwrap();
        // ok_msg.

        // send message:
        if socket
            .send(ws::Message::Binary(data.clone()))
            .await
            .is_err()
        {
            // client disconnected
            return;
        }
    }
}
