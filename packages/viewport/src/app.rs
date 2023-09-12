use egui::{emath::RectTransform, Color32, Frame, Pos2, Rect, Shape, Stroke, Vec2};
use egui_extras::RetainedImage;
use poll_promise::Promise;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

struct Resource {
    /// HTTP response
    response: ehttp::Response,

    text: Option<String>,

    /// If set, the response was an image.
    image: Option<RetainedImage>,
}

impl Resource {
    fn from_response(ctx: &egui::Context, response: ehttp::Response) -> Self {
        let content_type = response.content_type().unwrap_or_default();
        let image = if content_type.starts_with("image/") {
            RetainedImage::from_image_bytes(&response.url, &response.bytes).ok()
        } else {
            None
        };

        let text = response.text();
        let text = text.map(|text| text.to_owned());

        Self {
            response,
            text,
            image,
        }
    }
}

#[cfg_attr(feature = "serde", derive(serde::Deserialize, serde::Serialize))]
pub struct TemplateApp {
    label: String,

    #[cfg_attr(feature = "serde", serde(skip))]
    promise: Option<Promise<ehttp::Result<Resource>>>,
}

impl Default for TemplateApp {
    fn default() -> Self {
        Self {
            label: "Hello World!".to_owned(),
            promise: Default::default(),
        }
    }
}

impl TemplateApp {
    pub fn new(cc: &eframe::CreationContext<'_>) -> Self {
        // if let Some(storage) = cc.storage {
        //     return eframe::get_value(storage, eframe::APP_KEY).unwrap_or_default();
        // }
        Default::default()
    }
}

impl eframe::App for TemplateApp {
    // fn save(&mut self, storage: &mut dyn eframe::Storage) {
    //     eframe::set_value(storage, eframe::APP_KEY, self);
    // }

    fn clear_color(&self, _visuals: &egui::Visuals) -> [f32; 4] {
        return [0.0, 0.0, 0.0, 0.0];
    }

    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        let frame = Frame::none()
            .fill(Color32::from_rgb(17, 17, 17))
            .inner_margin(egui::style::Margin {
                left: 10.,
                right: 10.,
                top: 10.,
                bottom: 10.,
            });

        // image::load(r, format)

        egui::CentralPanel::default().frame(frame).show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.heading(&self.label);
            });

            let btn = ui.button("load");

            if btn.clicked() {
                let ctx = ctx.clone();
                let (sender, promise) = Promise::new();
                let request = ehttp::Request::get("http://127.0.0.1:8000/api/local/thumbnail?file=%2FUsers%2Ftihav%2FPictures%2F_MG_0013.CR2");
                ehttp::fetch(request, move |response| {
                    ctx.request_repaint(); // wake up UI thread
                    let resource = response.map(|response| Resource::from_response(&ctx, response));
                    sender.send(resource);
                });
                self.promise = Some(promise);
            }

            if let Some(promise) = &self.promise {
                if let Some(result) = promise.ready() {
                    match result {
                        Ok(resource) => {
                            ui_resource(ui, resource);
                        }
                        Err(error) => {
                            // This should only happen if the fetch API isn't available or something similar.
                            ui.colored_label(
                                ui.visuals().error_fg_color,
                                if error.is_empty() { "Error" } else { error },
                            );
                        }
                    }
                } else {
                    ui.spinner();
                }
            }

            // ctx.inspection_ui(ui);

            // ui.image(texture_id, size)
            // ui.strong("Bold text");

            // // Create a "canvas" for drawing on that's 100% x 300px
            // let (response, painter) =
            //     ui.allocate_painter(Vec2::new(ui.available_width(), 300.0), egui::Sense::hover());

            // // Get the relative position of our "canvas"
            // let to_screen = RectTransform::from_to(
            //     Rect::from_min_size(Pos2::ZERO, response.rect.size()),
            //     response.rect,
            // );

            // // The line we want to draw represented as 2 points
            // let first_point = Pos2 { x: 0.0, y: 0.0 };
            // let second_point = Pos2 { x: 300.0, y: 300.0 };
            // // Make the points relative to the "canvas"
            // let first_point_in_screen = to_screen.transform_pos(first_point);
            // let second_point_in_screen = to_screen.transform_pos(second_point);

            // // Paint the line!
            // painter.add(Shape::LineSegment {
            //     points: [first_point_in_screen, second_point_in_screen],
            //     stroke: Stroke {
            //         width: 10.0,
            //         color: Color32::BLUE,
            //     },
            // });
        });
    }
}

fn ui_resource(ui: &mut egui::Ui, resource: &Resource) {
    let Resource {
        response,
        text,
        image,
    } = resource;

    ui.separator();

    egui::ScrollArea::vertical()
        .auto_shrink([false; 2])
        .show(ui, |ui| {
            if let Some(image) = image {
                let mut size = image.size_vec2();
                size *= (ui.available_width() / size.x).min(1.0);
                image.show_size(ui, size);
            }
        });
}
