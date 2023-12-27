use anyhow::Result;
pub use libsql_client::{Client, Config, Statement};
use serde::{Deserialize, Serialize};
use std::env;
use std::{fs, path::Path};

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

pub struct Database {
  client: Client,
}

impl Database {
  pub async fn new() -> Database {
    Database {
      client: Client::from_config(Config {
        url: url::Url::parse(env::var("DATABASE").expect("No Database set").as_str()).unwrap(),
        auth_token: env::var("TURSO_AUTH_TOKEN").ok(),
      })
      .await
      .expect("Failed to create db client"),
    }
  }

  pub async fn init_db(&self) -> Result<()> {
    if !Path::exists(&Path::new("./data/")) {
      fs::create_dir("./data/").expect("Unable to create dir './data/'");
    }

    self
      .client
      .batch([
        // table: locations
        Statement::from(
          "create table if not exists locations (id TEXT PRIMARY KEY, name TEXT, path TEXT);",
        ),
        // table: files
        Statement::from(
          "create table if not exists files (hash TEXT PRIMARY KEY, tags TEXT, rating INTEGER);",
        ),
        // table: presets
        Statement::from("create table if not exists presets (id TEXT PRIMARY KEY, edits INTEGER);"),
        // table: edits
        Statement::from(
          "create table if not exists edits (id TEXT PRIMARY KEY, edits TEXT, file TEXT);",
        ),
        // table: set
        Statement::from(
          "create table if not exists sets (id TEXT PRIMARY KEY, tags TEXT, rating INTEGER);",
        ),
        // table: tags
        Statement::from("create table if not exists tags (id TEXT PRIMARY KEY, name TEXT);"),
      ])
      .await?;

    let list = self.location_list().await?;
    if list.len() == 0 {
      self
        .insert_location("default", "/Users/tihav/Pictures")
        .await?;
    }

    return Ok(());
  }

  pub async fn insert_tag(&self, name: &str) -> Result<String> {
    let uid = uuid::Uuid::new_v4().to_string();

    self
      .client
      .execute(Statement::with_args(
        "insert into tags (id, name) values (?, ?)",
        &[&uid, &name.to_string()],
      ))
      .await?;

    Ok(uid)
  }

  pub async fn insert_edit(&self, hash: &str, edits: &str) -> Result<()> {
    let uid = uuid::Uuid::new_v4().to_string();

    self
      .client
      .execute(Statement::with_args(
        "insert into edits (id, edits, file) values (?, ?, ?)",
        &[&uid, &edits.to_string(), &hash.to_string()],
      ))
      .await?;

    Ok(())
  }

  pub async fn insert_file(&self, hash: &str, rating: i32) -> Result<()> {
    self
      .client
      .execute(Statement::with_args(
        "insert into files (hash, rating, tags) values (?1, ?2, ?3)",
        &[&hash.to_string(), &rating.to_string(), &"".to_string()],
      ))
      .await?;

    Ok(())
  }

  pub async fn get_edits(&self, hash: &str) -> Result<Vec<Edit>> {
    let rs = self
      .client
      .execute(Statement::with_args(
        "select id, edits, file from edits where file = ?",
        &[&hash.to_string()],
      ))
      .await?;

    let rows = rs.rows.iter().map(|row| Edit {
      id: row.values.get(0).unwrap().to_string(),
      edits: row.values.get(1).unwrap().to_string(),
      file: row.values.get(2).unwrap().to_string(),
    });

    let list: Vec<Edit> = rows.collect();
    return Ok(list);
  }

  pub async fn get_file(&self, hash: &str) -> Result<Vec<File>> {
    let rs = self
      .client
      .execute(Statement::with_args(
        "select hash, tags, rating from files where hash = ?",
        &[&hash.to_string()],
      ))
      .await?;

    let rows = rs.rows.iter().map(|row| {
      let tags: String = row.values.get(1).unwrap().to_string();

      File {
        hash: row.values.get(0).unwrap().to_string(),
        tags: tags.split(",").map(|str| String::from(str)).collect(),
        rating: row.values.get(2).unwrap().try_into().unwrap(),
      }
    });

    let list: Vec<File> = rows.collect();
    return Ok(list);
  }

  pub async fn set_rating(&self, hash: &str, rating: i32) -> Result<()> {
    self
      .client
      .execute(Statement::with_args(
        "update files SET rating = ?1 where hash = ?2",
        &[rating.to_string(), hash.to_string()],
      ))
      .await?;

    Ok(())
  }

  pub async fn set_tags(&self, hash: &str, tags: &Vec<String>) -> Result<()> {
    let ts = tags.join(",");

    self
      .client
      .execute(Statement::with_args(
        "update files SET tags = ?1 where hash = ?2",
        &[ts, hash.to_string()],
      ))
      .await?;

    Ok(())
  }

  pub async fn insert_location(&self, name: &str, path: &str) -> Result<()> {
    let uid = uuid::Uuid::new_v4().to_string();

    self
      .client
      .execute(Statement::with_args(
        "insert into locations (id, name, path) values (?1, ?2, ?3)",
        &[&uid, &name.to_string(), &path.to_string()],
      ))
      .await?;

    Ok(())
  }

  pub async fn location_list(&self) -> Result<Vec<Location>> {
    let rs = self
      .client
      .execute(Statement::from("select id, name, path from locations"))
      .await?;

    let rows = rs.rows.iter().map(|row| Location {
      id: row.values.get(0).unwrap().to_string(),
      name: row.values.get(1).unwrap().to_string(),
      path: row.values.get(2).unwrap().to_string(),
    });

    let list: Vec<Location> = rows.collect();
    return Ok(list);
  }

  pub async fn tags_list(&self) -> Result<Vec<Tag>> {
    let rs = self
      .client
      .execute(Statement::from("select id, name from tags"))
      .await?;

    let rows = rs.rows.iter().map(|row| Tag {
      id: row.values.get(0).unwrap().to_string(),
      name: row.values.get(1).unwrap().to_string(),
    });

    let list: Vec<Tag> = rows.collect();
    return Ok(list);
  }
}
