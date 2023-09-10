use actix_web::{
    get, http::header::ContentType, post, web, web::Bytes, App, HttpResponse, HttpServer, Responder,
};
use serde::Deserialize;
use std::env;
use urlencoding::decode;

#[derive(Deserialize)]
struct FileInfo {
    file: String,
}

#[derive(Deserialize)]
struct LibraryInfo {
    name: String,
}

#[get("/api/local/open")]
async fn open(info: web::Query<FileInfo>) -> HttpResponse {
    let p = decode(&info.file).expect("UTF-8");
    let n = phl_image::open(p.to_string());

    println!("{} x {}", n.width(), n.height());

    let body = Bytes::from(n.as_rgb8().unwrap().to_vec());

    HttpResponse::Ok()
        .content_type(ContentType::octet_stream())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(body)
}

#[get("/api/local/metadata")]
async fn metadata(info: web::Query<FileInfo>) -> impl Responder {
    let p = decode(&info.file).expect("UTF-8");
    let m = phl_image::metadat(p.to_string());

    HttpResponse::Ok()
        .content_type(ContentType::json())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(serde_json::to_string(&m).unwrap())
}

#[get("/api/local/thumbnail")]
async fn thumbnail(info: web::Query<FileInfo>) -> impl Responder {
    let p = decode(&info.file).expect("UTF-8");

    return HttpResponse::Ok()
        .content_type(ContentType::jpeg())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(phl_image::cached_thumb(p.to_string()));
}

#[get("/api/library/list")]
async fn library_list() -> impl Responder {
    phl_library::create_root_library();

    let libs = phl_library::lib_list().unwrap();

    return HttpResponse::Ok()
        .content_type(ContentType::json())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(serde_json::to_string(&libs).unwrap());
}

#[get("/api/library/index")]
async fn library_index(info: web::Query<LibraryInfo>) -> impl Responder {
    let dir = phl_library::find_library(&info.name).unwrap().path;
    let list = phl_library::list(dir);
    HttpResponse::Ok()
        .content_type(ContentType::json())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(serde_json::to_string(&list).unwrap())
}

#[post("/api/library")]
async fn library_create() -> impl Responder {
    phl_library::create_library("new", "/Users/tihav/Desktop");

    HttpResponse::Ok()
        .content_type(ContentType::json())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body("{ \"ok\": true }")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Start server on 127.0.0.1:8000");

    HttpServer::new(|| {
        App::new()
            .service(library_index)
            .service(library_list)
            .service(metadata)
            .service(open)
            .service(thumbnail)
            .service(library_create)
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}
