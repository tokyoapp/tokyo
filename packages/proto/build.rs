use std::fs::{self};
use std::path::PathBuf;
use std::process::Command;

fn main() -> std::io::Result<()> {
  let include = PathBuf::from("src/protos");
  let input = PathBuf::from("src/protos/library.proto");
  let dist = PathBuf::from("src/gen");

  println!("Generating code from {:?} tp {:?}", input, dist.display());

  if !dist.exists() {
    fs::create_dir_all(dist.clone())?;
  }

  Command::new("protoc")
    .args([
      "-I",
      include.to_str().unwrap(),
      "--ts_proto_out",
      dist.to_str().unwrap(),
      input.to_str().unwrap(),
    ])
    .output()
    .expect("failed to execute process");

  Command::new("protoc")
    .args([
      "--rust_out",
      dist.to_str().unwrap(),
      input.to_str().unwrap(),
    ])
    .output()
    .expect("failed to execute process");

  Ok(())
}
