mod images;

use actix_web::{
    get, http::header::ContentType, web::Bytes, App, HttpRequest, HttpResponse, HttpServer,
    Responder,
};
use phl_image::DynamicImage;
use std::env;

#[get("/")]
async fn hello() -> impl Responder {
    let dir = env::var("DEFAULT_LIBRARY").expect("$DEFAULT_LIBRARY is not set");
    let list = images::list(dir);
    HttpResponse::Ok()
        .content_type(ContentType::json())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(serde_json::to_string(&list).unwrap())
}

#[get("/open")]
async fn open(req: HttpRequest) -> HttpResponse {
    let p = "/Users/tihav/Pictures/Footage/Korea/_MGC3321.CR3";
    let n = phl_image::open(p.to_string());

    println!("{} x {}", n.width(), n.height());

    let body = Bytes::from(n.as_rgb8().unwrap().to_vec());

    HttpResponse::Ok()
        .content_type(ContentType::octet_stream())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(body)

    // let mut p = File::create("/Users/tihav/Desktop/Image.png").unwrap();
    // img.write_to(&mut p, ImageOutputFormat::Png).unwrap();
}

#[get("/metadata")]
async fn metadata() -> impl Responder {
    let p = "/Users/tihav/Pictures/Footage/Korea/_MGC3321.CR3";
    let m = phl_image::metadat(p.to_string());

    HttpResponse::Ok()
        .content_type(ContentType::json())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(serde_json::to_string(&m).unwrap())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Start server on 127.0.0.1:8000");

    HttpServer::new(|| App::new().service(hello).service(metadata).service(open))
        .bind(("127.0.0.1", 8000))?
        .run()
        .await
}
