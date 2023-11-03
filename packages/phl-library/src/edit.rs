use std::path::Path;

use shadow::DynamicImage;
use shadow::Edits;

pub struct EditedImage {
  image: DynamicImage,
  edits: Edits,
}

impl EditedImage {
  pub fn new(path: &Path, edits: Edits) -> EditedImage {
    let image = shadow::get_image(path);

    EditedImage {
      image: image.unwrap(),
      edits,
    }
  }

  pub fn render(&mut self) -> DynamicImage {
    let img = shadow::process(&self.image, &self.edits);
    img
  }
}
