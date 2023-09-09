use actix_web::{
    get, http::header::ContentType, web, web::Bytes, App, HttpResponse, HttpServer, Responder,
};
use serde::Deserialize;
use std::env;
use urlencoding::decode;

#[derive(Deserialize)]
struct Info {
    file: String,
}

#[get("/api/open")]
async fn open(info: web::Query<Info>) -> HttpResponse {
    let p = decode(&info.file).expect("UTF-8");
    let n = phl_image::open(p.to_string());

    println!("{} x {}", n.width(), n.height());

    let body = Bytes::from(n.as_rgb8().unwrap().to_vec());

    HttpResponse::Ok()
        .content_type(ContentType::octet_stream())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(body)
}

#[get("/api/metadata")]
async fn metadata(info: web::Query<Info>) -> impl Responder {
    let p = decode(&info.file).expect("UTF-8");
    let m = phl_image::metadat(p.to_string());

    HttpResponse::Ok()
        .content_type(ContentType::json())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(serde_json::to_string(&m).unwrap())
}

#[get("/api/thumbnail")]
async fn thumbnail(info: web::Query<Info>) -> impl Responder {
    let p = decode(&info.file).expect("UTF-8");

    return HttpResponse::Ok()
        .content_type(ContentType::jpeg())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(phl_image::cached_thumb(p.to_string()));
}

#[get("/api/library")]
async fn library() -> impl Responder {
    phl_library::create_root_library();

    let lib = phl_library::default_library().unwrap();

    return HttpResponse::Ok()
        .content_type(ContentType::json())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(serde_json::to_string(&lib).unwrap());
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
async fn library_index() -> impl Responder {
    let dir = phl_library::default_library().unwrap().path;
    let list = phl_library::list(dir);
    HttpResponse::Ok()
        .content_type(ContentType::json())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(serde_json::to_string(&list).unwrap())
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
            .service(library)
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}
