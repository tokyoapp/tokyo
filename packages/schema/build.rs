use std::path::PathBuf;
use std::process::Command;

fn main() -> std::io::Result<()> {
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
      PathBuf::from("proto").to_str().unwrap(),
      "--ts_proto_out",
      PathBuf::from("src").to_str().unwrap(),
      PathBuf::from("proto/schema.proto").to_str().unwrap(),
    ])
    .status()
    .expect("failed to execute process");

  tonic_prost_build::configure()
      .build_server(false)
      .out_dir("src")
      .compile_protos(
          &["proto/schema.proto"],
          &["proto"],
      )?;

  Ok(())
}
