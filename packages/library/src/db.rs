pub mod schema;

use anyhow::Result;
use libsql::{params, Connection, Database};
use std::env;
use std::{fs, path::Path};

pub struct LibraryDatabase {
  connection: Connection,
}

impl LibraryDatabase {
  pub async fn new() -> LibraryDatabase {
    let db = Database::open(
      url::Url::parse(env::var("DATABASE").expect("No Database set").as_str()).unwrap(),
    )
    .unwrap();

    LibraryDatabase {
      connection: db.connect().expect("Failed to connecto to db"),
    }
  }

  pub async fn init_db(&self) -> Result<()> {
    if !Path::exists(&Path::new("./data/")) {
      fs::create_dir("./data/").expect("Unable to create dir './data/'");
    }

    // table: locations
    self
      .connection
      .execute(
        "create table if not exists locations (id TEXT PRIMARY KEY, name TEXT, path TEXT);",
        params![],
      )
      .await?;

    // table: files
    self
      .connection
      .execute(
        "create table if not exists files (hash TEXT PRIMARY KEY, tags TEXT, rating INTEGER);",
        params![],
      )
      .await?;

    // table: presets
    self
      .connection
      .execute(
        "create table if not exists presets (id TEXT PRIMARY KEY, edits INTEGER);",
        params![],
      )
      .await?;

    // table: edits
    self
      .connection
      .execute(
        "create table if not exists edits (id TEXT PRIMARY KEY, edits TEXT, file TEXT);",
        params![],
      )
      .await?;

    // table: set
    self
      .connection
      .execute(
        "create table if not exists sets (id TEXT PRIMARY KEY, tags TEXT, rating INTEGER);",
        params![],
      )
      .await?;

    // table: tags
    self
      .connection
      .execute(
        "create table if not exists tags (id TEXT PRIMARY KEY, name TEXT);",
        params![],
      )
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
      .connection
      .execute(
        "insert into tags (id, name) values (?, ?)",
        params![uid.clone(), name.to_string().clone()],
      )
      .await?;

    Ok(uid)
  }

  pub async fn insert_edit(&self, hash: &str, edits: &str) -> Result<()> {
    let uid = uuid::Uuid::new_v4().to_string();

    self
      .connection
      .execute(
        "insert into edits (id, edits, file) values (?, ?, ?)",
        params![
          uid.clone(),
          edits.to_string().clone(),
          hash.to_string().clone()
        ],
      )
      .await?;

    Ok(())
  }

  pub async fn insert_file(&self, hash: &str, rating: i32) -> Result<()> {
    self
      .connection
      .execute(
        "insert into files (hash, rating, tags) values (?1, ?2, ?3)",
        params![
          hash.to_string().clone(),
          rating.to_string().clone(),
          "".to_string()
        ],
      )
      .await?;

    self
      .connection
      .execute(
        "insert into files (hash, rating, tags) values (?1, ?2, ?3)",
        params![],
      )
      .await?;

    Ok(())
  }

  pub async fn get_edits(&self, hash: &str) -> Result<Vec<schema::Edit>> {
    let mut rs = self
      .connection
      .query(
        "select id, edits, file from edits where file = ?",
        params![hash.to_string().clone()],
      )
      .await?;

    let mut list: Vec<schema::Edit> = Vec::new();

    while let Ok(Some(row)) = rs.next() {
      list.push(schema::Edit {
        id: row.get_str(0)?.to_string(),
        edits: row.get_str(1)?.to_string(),
        file: row.get_str(2)?.to_string(),
      })
    }

    return Ok(list);
  }

  pub async fn get_file(&self, hash: &str) -> Result<Vec<schema::File>> {
    let mut rs = self
      .connection
      .query(
        "select hash, tags, rating from files where hash = ?",
        params![hash.to_string().clone()],
      )
      .await?;

    let mut list: Vec<schema::File> = Vec::new();

    while let Ok(Some(row)) = rs.next() {
      let tags: String = row.get_str(1).unwrap().to_string();

      list.push(schema::File {
        hash: row.get_str(0).unwrap().to_string(),
        tags: tags.split(",").map(|str| String::from(str)).collect(),
        rating: row
          .get_value(2)?
          .as_integer()
          .unwrap()
          .to_owned()
          .try_into()?,
      })
    }

    return Ok(list);
  }

  pub async fn set_rating(&self, hash: &str, rating: i32) -> Result<()> {
    self
      .connection
      .execute(
        "update files SET rating = ?1 where hash = ?2",
        params![rating.to_string(), hash.to_string()],
      )
      .await?;

    Ok(())
  }

  pub async fn set_tags(&self, hash: &str, tags: &Vec<String>) -> Result<()> {
    let ts = tags.join(",");

    self
      .connection
      .execute(
        "update files SET tags = ?1 where hash = ?2",
        params![ts, hash.to_string()],
      )
      .await?;

    Ok(())
  }

  pub async fn insert_location(&self, name: &str, path: &str) -> Result<()> {
    let uid = uuid::Uuid::new_v4().to_string();

    self
      .connection
      .execute(
        "insert into locations (id, name, path) values (?1, ?2, ?3)",
        params![uid, name.to_string().clone(), path.to_string().clone()],
      )
      .await?;

    Ok(())
  }

  pub async fn location_list(&self) -> Result<Vec<schema::Location>> {
    let mut rs = self
      .connection
      .query("select id, name, path from locations", params![])
      .await?;

    let mut list: Vec<schema::Location> = Vec::new();

    while let Ok(Some(row)) = rs.next() {
      list.push(schema::Location {
        id: row.get_str(0)?.to_string(),
        name: row.get_str(1)?.to_string(),
        path: row.get_str(2)?.to_string(),
      })
    }

    return Ok(list);
  }

  pub async fn tags_list(&self) -> Result<Vec<schema::Tag>> {
    let mut rs = self
      .connection
      .query("select id, name from tags", params![])
      .await?;

    let mut list: Vec<schema::Tag> = Vec::new();

    while let Ok(Some(row)) = rs.next() {
      list.push(schema::Tag {
        id: row.get_str(0)?.to_string(),
        name: row.get_str(1)?.to_string(),
      })
    }

    return Ok(list);
  }
}
