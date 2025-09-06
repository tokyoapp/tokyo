#[cfg(feature = "protoc")]
mod generated;

#[cfg(feature = "protoc")]
pub use generated::schema;

pub use protobuf::Message;
