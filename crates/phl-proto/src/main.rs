mod generated;

use generated::library::{self, Library};
use protobuf::Message;

pub fn main() {
    let mut lib = Library::new();
    lib.name = "default".to_string();

    let bytes = lib.write_to_bytes();

    println!("{:?}", bytes);
}
