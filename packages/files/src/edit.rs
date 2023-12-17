use std::path::Path;

use tokyo_shadow::DynamicImage;
use tokyo_shadow::Edits;

pub struct EditedImage {
  image: DynamicImage,
  edits: Edits,
}

impl EditedImage {
  pub fn new(path: &Path, edits: Edits) -> EditedImage {
    let image = tokyo_shadow::get_image(path);

    EditedImage {
      image: image.unwrap(),
      edits,
    }
  }

  pub fn render(&mut self) -> DynamicImage {
    let img = tokyo_shadow::process(&self.image, &self.edits);
    img
  }
}
