mod images;
use actix_web::{
    get, http::header::ContentType, web, web::Bytes, App, HttpRequest, HttpResponse, HttpServer,
    Responder,
};
use serde::Deserialize;
use std::env;
use std::fs;
use std::path::Path;
use urlencoding::decode;

#[get("/")]
async fn hello() -> impl Responder {
    let dir = env::var("DEFAULT_LIBRARY").expect("$DEFAULT_LIBRARY is not set");
    let list = images::list(dir);
    HttpResponse::Ok()
        .content_type(ContentType::json())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(serde_json::to_string(&list).unwrap())
}

#[derive(Deserialize)]
struct Info {
    file: String,
}

#[get("/open")]
async fn open(info: web::Query<Info>) -> HttpResponse {
    let p = decode(&info.file).expect("UTF-8");
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
async fn metadata(info: web::Query<Info>) -> impl Responder {
    let p = decode(&info.file).expect("UTF-8");
    let m = phl_image::metadat(p.to_string());

    HttpResponse::Ok()
        .content_type(ContentType::json())
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body(serde_json::to_string(&m).unwrap())
}

#[get("/thumbnail")]
async fn thumbnail(info: web::Query<Info>) -> impl Responder {
    let p = decode(&info.file).expect("UTF-8");

    let bytes = std::fs::read(p.to_string()).unwrap(); // Vec<u8>

    let ext = Path::new(&info.file).extension().unwrap().to_str().unwrap();
    match ext {
        "jpg" => {
            return HttpResponse::Ok()
                .content_type(ContentType::jpeg())
                .insert_header(("Access-Control-Allow-Origin", "*"))
                .body(bytes);
        }
        "png" => {
            return HttpResponse::Ok()
                .content_type(ContentType::png())
                .insert_header(("Access-Control-Allow-Origin", "*"))
                .body(bytes);
        }
        &_ => {}
    }

    // content id
    let hash = sha256::digest(&bytes);

    println!("hash of {}: {}", p, hash);

    let cache_dir = "./tmp";

    let thumbnail_path = cache_dir.to_owned() + "/" + &hash + ".jpg";

    if Path::new(&thumbnail_path).exists() {
        println!("thumb exists {}", thumbnail_path);

        return HttpResponse::Ok()
            .content_type(ContentType::jpeg())
            .insert_header(("Access-Control-Allow-Origin", "*"))
            .body(fs::read(&thumbnail_path).unwrap());
    } else {
        println!("PP {}", p);
        let thumb = phl_image::thumbnail(p.to_string());
        let body = Bytes::from(thumb);

        fs::create_dir_all(cache_dir);
        fs::write(thumbnail_path, &body);

        return HttpResponse::Ok()
            .content_type(ContentType::jpeg())
            .insert_header(("Access-Control-Allow-Origin", "*"))
            .body(body);
    }

    // TODO: thumbnail caching using content hashes

    // image::save_buffer(&Path::new("image.png"), buffer, 800, 600, image::RGBA(8))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Start server on 127.0.0.1:8000");

    HttpServer::new(|| {
        App::new()
            .service(hello)
            .service(metadata)
            .service(open)
            .service(thumbnail)
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}
