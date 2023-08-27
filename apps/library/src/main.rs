mod images;

use actix_web::{get, post, App, HttpResponse, HttpServer, Responder};
use std::env;

#[get("/")]
async fn hello() -> impl Responder {
    let dir = env::var("DEFAULT_LIBRARY").expect("$DEFAULT_LIBRARY is not set");
    HttpResponse::Ok().body(images::list(dir))
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Start server on 127.0.0.1:8000");

    HttpServer::new(|| App::new().service(hello).service(echo))
        .bind(("127.0.0.1", 8000))?
        .run()
        .await
}
