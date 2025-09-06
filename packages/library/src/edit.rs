use std::path::Path;

pub struct EditedImage {
  // image: tokyo_shadow::DynamicImage,
  // edits: tokyo_shadow::Edits,
}

impl EditedImage {
  pub fn new(path: &Path) -> EditedImage {
    // let image = tokyo_shadow::get_image(path);

    EditedImage {
      // image: image.unwrap(),
      // edits,
    }
  }

  // pub fn render(&mut self) -> tokyo_shadow::DynamicImage {
  //   let img = tokyo_shadow::process(&self.image, &self.edits);
  //   img
  // }
}
