#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")] // hide console window on Windows in release

use std::path::Path;

use eframe::{
  egui::{self, PointerButton, Vec2},
  emath::Align2,
  epaint::{ColorImage, Pos2, TextureHandle},
  glow::ACTIVE_SUBROUTINE_MAX_LENGTH,
};
use shadow::DynamicImage;
use shadow::Edits;
use std::ops::Add;

struct MyImage {
  texture: Option<egui::TextureHandle>,
  image: DynamicImage,
  zoom: f32,
  position: Pos2,
  output: Option<TextureHandle>,
  edits: Edits,
}

impl MyImage {
  fn new(path: &Path) -> MyImage {
    let image = shadow::get_image(path);

    MyImage {
      texture: None,
      zoom: 1.0,
      position: Pos2 { x: 0.0, y: 0.0 },
      output: None,
      image,
      edits: Edits {
        gamma: 2.2,
        exposure: 0.0,
        curve: vec![(0.00, 0.00), (1.0, 1.0)],
      },
    }
  }

  fn render(&mut self, ui: &mut egui::Ui) {
    println!("{:?}", self.edits.exposure);

    let img = shadow::process(&self.image, &self.edits);

    self.output = Some(ui.ctx().load_texture(
      "my-image",
      egui::ColorImage::from_rgb(
        [self.image.width() as usize, self.image.height() as usize],
        &img.to_rgb8(),
      ),
      Default::default(),
    ));
  }

  fn ui(&mut self, ui: &mut egui::Ui) {
    let ctx = ui.ctx();

    if let Some(img) = self.output.clone() {
      let texture: &egui::TextureHandle = self.texture.insert(img);

      egui::Area::new("view")
        .movable(true)
        .pivot(Align2::CENTER_CENTER)
        .default_pos(Pos2 {
          x: ctx.screen_rect().width() / 2.0,
          y: ctx.screen_rect().height() / 2.0,
        })
        .drag_bounds(ctx.available_rect().expand(10000.0))
        .show(ctx, |ui| {
          ui.image(texture, texture.size_vec2() * 0.15);
        });
    }
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
      ctx.input(|i| {
        if i.pointer.primary_released() {
          my_image.render(ui);
        }
      });

      ui.add(egui::Slider::new(&mut my_image.edits.exposure, -1.0..=1.0).text("Exposure"));
      ui.add(egui::Slider::new(&mut my_image.edits.gamma, 1.0..=2.4).text("Gamme"));
      my_image.ui(ui);
    });
  })
}
