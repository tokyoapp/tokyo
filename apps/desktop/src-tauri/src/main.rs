use phl_library;
use std::env;

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#[cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
//
// #[tauri::command]
// fn open(path: &str) -> Vec<u16> {
//     let p = "/Users/tihav/Pictures/Footage/Korea/_MGC3321.CR3";
//     let n = phl_image::open(p.to_string());

//     println!("{} x {}", n.width(), n.height());

//     let x = n.as_rgb16().unwrap().to_vec();
//     return x;

//     // let mut p = File::create("/Users/tihav/Desktop/Image.png").unwrap();
//     // img.write_to(&mut p, ImageOutputFormat::Png).unwrap();
// }

// get local library list
#[tauri::command]
fn list() -> Vec<phl_library::Library> {
    phl_library::create_root_library().expect("Failed to create root library");

    return phl_library::lib_list().unwrap();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![list])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
