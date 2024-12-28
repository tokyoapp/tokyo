use kitty_image::{Action, ActionTransmission, Command, Format, Medium, WrappedCommand};
use std::env;

fn main() -> Result<(), image::error::ImageError> {
  let args: Vec<String> = env::args().collect();
  let filename = args[1].as_str();

  let action = Action::TransmitAndDisplay(
    ActionTransmission {
      format: Format::Png,
      medium: Medium::File,
      ..Default::default()
    },
    kitty_image::ActionPut {
      move_cursor: true,
      ..Default::default()
    },
  );

  let command = Command::with_payload_from_path(action, filename.as_ref());
  let command = WrappedCommand::new(command);
  println!("{command}");

  Ok(())
}
