use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Tag {
  pub id: String,
  pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Set {
  pub id: String,
  pub tags: Vec<String>,
  pub rating: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Location {
  pub id: String,
  pub name: String,
  pub path: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Edit {
  pub id: String,
  pub edits: String,
  pub file: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Preset {
  pub id: String,
  pub edits: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct File {
  pub hash: String,
  pub rating: i32,
  pub tags: Vec<String>,
}
