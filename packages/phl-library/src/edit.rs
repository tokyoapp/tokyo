use std::path::Path;

use shadow::DynamicImage;
use shadow::Edits;

pub struct EditedImage {
  image: DynamicImage,
  edits: Edits,
}

impl EditedImage {
  pub fn new(path: &Path) -> EditedImage {
    let image = shadow::get_image(path);

    EditedImage {
      image: image.unwrap(),
      edits: Edits {
        gamma: 2.2,
        exposure: 0.1,
        curve: vec![(0.00, 0.00), (1.0, 1.0)],
      },
    }
  }

  pub fn render(&mut self) -> DynamicImage {
    let img = shadow::process(&self.image, &self.edits);
    img
  }
}
