#[cfg(feature = "protoc")]
mod gen;

#[cfg(feature = "protoc")]
pub use gen::schema;

pub use protobuf::Message;
