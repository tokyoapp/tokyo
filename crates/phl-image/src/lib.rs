pub use image::{DynamicImage, ImageBuffer};
use rawler::{
    decoders::RawDecodeParams,
    get_decoder,
    imgop::{raw::develop_raw_srgb, rescale_f32_to_u16},
    RawFile, RawImageData,
};
use std::time::Instant;
use std::{fs::File, io::BufReader, path::PathBuf};

#[derive(serde::Serialize)]
pub struct Metadata {
    width: u32,
    height: u32,
    orientation: u16,
}

pub fn metadat(path: String) -> Metadata {
    let raw_file = File::open(&path).unwrap();
    let mut rawfile = RawFile::new(PathBuf::from(path), BufReader::new(raw_file));

    let decoder = get_decoder(&mut rawfile).unwrap();
    let metadata = decoder.raw_metadata(&mut rawfile, RawDecodeParams { image_index: 0 });

    let rawimage = decoder
        .raw_image(&mut rawfile, RawDecodeParams { image_index: 0 }, false)
        .unwrap();

    return Metadata {
        width: rawimage.width as u32,
        height: rawimage.height as u32,
        orientation: metadata.unwrap().exif.orientation.unwrap(),
    };
}

pub fn open(path: String) -> DynamicImage {
    println!("{}", path);

    let raw_file = File::open(&path).unwrap();
    let mut rawfile = RawFile::new(PathBuf::from(path), BufReader::new(raw_file));

    println!("decode");

    let raw_params = RawDecodeParams { image_index: 0 };
    let decoder = crate::get_decoder(&mut rawfile).unwrap();
    let rawimage = decoder
        .raw_image(&mut rawfile, raw_params.clone(), false)
        .unwrap();

    let start = Instant::now();

    let full_img = match rawimage.develop_params() {
        Ok(params) => {
            let buf = match &rawimage.data {
                RawImageData::Integer(buf) => buf,
                RawImageData::Float(_) => todo!(),
            };
            let (srgbf, dim) = develop_raw_srgb(buf, &params).unwrap();
            let output = rescale_f32_to_u16(&srgbf, 0, u16::MAX);
            let img = DynamicImage::ImageRgb16(
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

    println!("{}", start.elapsed().as_millis());

    let img = full_img.unwrap();

    return img;
}
