use std::fs::{self};
use std::path::PathBuf;
use std::process::Command;

fn main() -> std::io::Result<()> {
  let include = PathBuf::from("src/protos");
  let input = PathBuf::from("src/protos/schema.proto");
  let dist = PathBuf::from("src/generated");

  println!("Generating code from {:?} tp {:?}", input, dist.display());

  if !dist.exists() {
    fs::create_dir_all(dist.clone())?;
  }

  let out = Command::new("protoc")
    .args([
      "--version",
    ])
    .output()
    .expect("failed to execute process");

  println!("{:?}", out);

  Command::new("protoc")
    .args([
      "-I",
      include.to_str().unwrap(),
      "--ts_proto_out",
      dist.to_str().unwrap(),
      input.to_str().unwrap(),
    ])
    .status()
    .expect("failed to execute process");

  tonic_prost_build::compile_protos("proto/service.proto")?;

  Ok(())
}
