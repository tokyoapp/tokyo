pub mod proto;

pub use prost;

impl Into<Vec<u8>> for proto::Message {
  /// Converts a protobuf Message into a byte vector using prost encoding
  fn into(self) -> Vec<u8> {
    use prost::Message;
    let mut buf = Vec::new();
    buf.reserve(self.encoded_len());
    self.encode(&mut buf).expect("Failed to encode message");
    buf
  }
}

impl TryFrom<Vec<u8>> for proto::Message {
  type Error = prost::DecodeError;

  /// Converts a byte vector into a protobuf Message using prost decoding
  fn try_from(value: Vec<u8>) -> Result<Self, Self::Error> {
    use prost::Message;
    proto::Message::decode(&value[..])
  }
}

impl TryFrom<Vec<u8>> for proto::ClientMessage {
  type Error = prost::DecodeError;

  /// Converts a byte vector into a protobuf Message using prost decoding
  fn try_from(value: Vec<u8>) -> Result<Self, Self::Error> {
    use prost::Message;
    proto::ClientMessage::decode(&value[..])
  }
}
