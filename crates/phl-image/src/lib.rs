use image::imageops::FilterType;
pub use image::{DynamicImage, ImageBuffer};
use rawler::{
    analyze::extract_thumbnail_pixels,
    decoders::RawDecodeParams,
    get_decoder,
    imgop::{raw, rescale_f32_to_u8},
    RawFile, RawImageData,
};
use std::{fs::File, io::BufReader, path::{PathBuf, Path}, time::SystemTime};
use std::fs;
use std::{io::Cursor, time::Instant};

#[derive(serde::Serialize, Debug)]
pub struct Metadata {
    pub hash: String,
    pub width: u32,
    pub height: u32,
    pub orientation: u16,
}

pub fn metadat(path: String) -> Metadata {
    println!("collect metadata");
    let raw_file = File::open(&path).unwrap();
    let reader = BufReader::new(raw_file);

    // let bytes = std::fs::read(path.to_string()).unwrap(); // Vec<u8>
    // let hash = sha256::digest(&bytes);

    let mut rawfile = RawFile::new(PathBuf::from(path.clone()), reader);

    let decoder = get_decoder(&mut rawfile).unwrap();

    let metadata = decoder
        .raw_metadata(&mut rawfile, RawDecodeParams { image_index: 0 })
        .unwrap();

    // let rawimage = decoder
    //     .raw_image(&mut rawfile, RawDecodeParams { image_index: 0 }, false)
    //     .unwrap();

    return Metadata {
        hash: "none".to_owned(),
        width: 0,
        height: 0,
        orientation: metadata.exif.orientation.unwrap(),
    };
}

pub fn thumbnail(path: String) -> Vec<u8> {
    let start = SystemTime::now();
    println!("open raw file");

    let mut thumb = extract_thumbnail_pixels(path, RawDecodeParams { image_index: 0 }).unwrap();
    thumb = thumb.resize(thumb.width() / 3, thumb.height() / 3, FilterType::Nearest);

    println!("write thumbnail {}", start.elapsed().unwrap().as_millis());

    let mut bytes: Vec<u8> = Vec::new();
    thumb
        .write_to(
            &mut Cursor::new(&mut bytes),
            image::ImageOutputFormat::Jpeg(85),
        )
        .unwrap();

    return bytes;
}

pub fn cached_thumb(p: String) -> Vec<u8> {
    let bytes = std::fs::read(p.to_string()).unwrap(); // Vec<u8>

    let ext = Path::new(&p).extension().unwrap().to_str().unwrap();
    match ext {
        "jpg" => {
            return bytes;
        }
        "png" => {
            return bytes;
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

        return fs::read(&thumbnail_path).unwrap();
    } else {
        println!("PP {}", p);
        let thumb = thumbnail(p.to_string());

        let _ = fs::create_dir_all(cache_dir);
        let _ = fs::write(thumbnail_path, &thumb);

        return thumb;
    }

}

pub fn open(path: String) -> DynamicImage {
    let start = Instant::now();
    println!("read file {}", path);

    let raw_file = File::open(&path).unwrap();
    let mut rawfile = RawFile::new(PathBuf::from(path), BufReader::new(raw_file));

    println!("start decode {}", start.elapsed().as_millis());

    let raw_params = RawDecodeParams { image_index: 0 };
    let decoder = crate::get_decoder(&mut rawfile).unwrap();
    let rawimage = decoder
        .raw_image(&mut rawfile, raw_params.clone(), false)
        .unwrap();

    println!("develop {}", start.elapsed().as_millis());

    let full_img = match rawimage.develop_params() {
        Ok(params) => {
            let buf = match &rawimage.data {
                RawImageData::Integer(buf) => buf,
                RawImageData::Float(_) => todo!(),
            };
            let (srgbf, dim) = raw::develop_raw_srgb(buf, &params).unwrap();
            println!("reformat {}", start.elapsed().as_millis());
            let output = rescale_f32_to_u8(&srgbf, 0, u8::MAX);
            let img = DynamicImage::ImageRgb8(
                ImageBuffer::from_raw(dim.w as u32, dim.h as u32, output)
                    .expect("Invalid ImageBuffer size"),
            );
            Some(img)
        }
        Err(err) => {
            println!("Err | {}", err);
            None
        }
    };

    println!("time done {}", start.elapsed().as_millis());

    let img = full_img.unwrap();

    return img;
}
