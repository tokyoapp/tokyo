use image::{codecs::jpeg::JpegEncoder, imageops::FilterType};
pub use image::{DynamicImage, ImageBuffer};
use rawler::{
    analyze::extract_thumbnail_pixels,
    decoders::RawDecodeParams,
    get_decoder,
    imgop::{raw, rescale_f32_to_u16, rescale_f32_to_u8},
    RawFile, RawImageData,
};
use std::{fs::File, io::BufReader, path::PathBuf, time::SystemTime};
use std::{io::Cursor, time::Instant};

#[derive(serde::Serialize, Debug)]
pub struct Metadata {
    pub width: u32,
    pub height: u32,
    pub orientation: u16,
    pub preview: Vec<u8>,
}

pub fn metadat(path: String) -> Metadata {
    let start = SystemTime::now();
    println!("open raw file");
    let raw_file = File::open(&path).unwrap();
    let mut rawfile = RawFile::new(PathBuf::from(path.clone()), BufReader::new(raw_file));

    let decoder = get_decoder(&mut rawfile).unwrap();

    let mut thumb = extract_thumbnail_pixels(path, RawDecodeParams { image_index: 0 }).unwrap();
    thumb = thumb.resize(thumb.width() / 3, thumb.height() / 3, FilterType::Nearest);

    println!("write thumbnail {}", start.elapsed().unwrap().as_millis());

    let metadata = decoder.raw_metadata(&mut rawfile, RawDecodeParams { image_index: 0 });

    let mut bytes: Vec<u8> = Vec::new();
    thumb
        .write_to(
            &mut Cursor::new(&mut bytes),
            image::ImageOutputFormat::Jpeg(85),
        )
        .unwrap();

    let rawimage = decoder
        .raw_image(&mut rawfile, RawDecodeParams { image_index: 0 }, false)
        .unwrap();

    return Metadata {
        width: rawimage.width as u32,
        height: rawimage.height as u32,
        orientation: metadata.unwrap().exif.orientation.unwrap(),
        preview: bytes,
    };
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
