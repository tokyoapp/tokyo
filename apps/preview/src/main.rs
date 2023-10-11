#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")] // hide console window on Windows in release

use std::path::Path;

use eframe::{
  egui::{self, PointerButton, Vec2},
  emath::Align2,
  epaint::{ColorImage, Pos2},
};
use shadow::DynamicImage;
use std::ops::Add;

struct MyImage {
  texture: Option<egui::TextureHandle>,
  image: DynamicImage,
  zoom: f32,
  position: Pos2,
}

impl MyImage {
  fn new(path: &Path) -> MyImage {
    let image = shadow::get_image(path);

    MyImage {
      texture: None,
      zoom: 1.0,
      position: Pos2 { x: 0.0, y: 0.0 },
      image,
    }
  }

  fn ui(&mut self, ui: &mut egui::Ui) {
    let ctx = ui.ctx();

    let texture: &egui::TextureHandle = self.texture.get_or_insert_with(|| {
      // Load the texture only once.
      ui.ctx().load_texture(
        "my-image",
        egui::ColorImage::from_rgb(
          [self.image.width() as usize, self.image.height() as usize],
          &self.image.to_rgb8(),
        ),
        Default::default(),
      )
    });

    egui::Area::new("view")
      .movable(true)
      .pivot(Align2::CENTER_CENTER)
      .default_pos(Pos2 {
        x: ctx.screen_rect().width() / 2.0,
        y: ctx.screen_rect().height() / 2.0,
      })
      .drag_bounds(ctx.available_rect().expand(10000.0))
      .show(ctx, |ui| {
        ui.image(texture, texture.size_vec2() * 0.125);
      });
  }
}

fn main() -> Result<(), eframe::Error> {
  env_logger::init();

  let options = eframe::NativeOptions {
    initial_window_size: Some(egui::vec2(820.0, 820.0)),
    ..Default::default()
  };

  println!("Loading image");

  let mut my_image = MyImage::new(&Path::new("./data/_MGC3203.CR3"));

  println!("Starting app");

  eframe::run_simple_native("My egui App", options, move |ctx, _frame| {
    egui::CentralPanel::default().show(ctx, |ui| {
      my_image.ui(ui);
    });
  })
}
