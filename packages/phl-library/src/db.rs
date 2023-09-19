use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::{fs, path::Path};

#[derive(Serialize, Deserialize, Debug)]
pub struct Tag {
  pub id: String,
  pub name: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Set {
  pub id: String,
  pub tags: Vec<Tag>,
  pub rating: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Location {
  pub id: String,
  pub name: String,
  pub path: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Edit {
  pub id: String,
  pub edits: String,
  pub file: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Preset {
  pub id: String,
  pub edits: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct File {
  pub hash: String,
  pub rating: i32,
}

pub struct Root {
  connection: Option<Connection>,
}

// trait Summary {
//     fn summarize(&self) -> String;
// }

// impl Summary for Root {
//     fn summarize(&self) -> String {
//         return String::from("Text");
//     }
// }

impl Root {
  pub fn new() -> Self {
    println!("Create root");

    Root { connection: None }
  }

  pub async fn connect(self: &mut Self) -> Result<(), rusqlite::Error> {
    println!("Connect to db");

    if !Path::exists(&Path::new("./data/")) {
      println!("Path for data exists");
      fs::create_dir("./data/").expect("Unable to create dir './data/'");
    }

    self.connection = Some(Connection::open("./data/db.sqlite")?);

    Ok(())
  }

  pub async fn init_db(self: &Self) -> Result<(), rusqlite::Error> {
    let con = self.connection.as_ref().unwrap();

    // table: locations
    con.execute(
      "create table if not exists locations (id TEXT, name TEXT, path TEXT);",
      (),
    )?;

    // table: files
    con.execute(
      "create table if not exists files (hash TEXT, rating INTEGER);",
      (),
    )?;

    // table: presets
    con.execute(
      "create table if not exists presets (id TEXT, edits INTEGER);",
      (),
    )?;

    // table: edits
    con.execute(
      "create table if not exists edits (id TEXT, edits TEXT, file TEXT);",
      (),
    )?;

    // table: set
    con.execute(
      "create table if not exists sets (id TEXT, tags TEXT, rating INTEGER);",
      (),
    )?;

    // table: tags
    con.execute("create table if not exists tags (id TEXT, name TEXT);", ())?;

    let list = self.location_list()?;
    if list.len() == 0 {
      self
        .insert_location("default", "/Users/tihav/Pictures")
        .await?;
    }

    return Ok(());
  }

  pub async fn insert_tag(self: &Self, name: &str) -> Result<(), rusqlite::Error> {
    let uid = uuid::Uuid::new_v4().to_string();

    self
      .connection
      .as_ref()
      .unwrap()
      .execute("insert into tags (id, name) values (?1, ?2)", (&uid, &name))?;

    Ok(())
  }

  pub async fn insert_edit(self: &Self, hash: &str, edits: &str) -> Result<(), rusqlite::Error> {
    let uid = uuid::Uuid::new_v4().to_string();

    self.connection.as_ref().unwrap().execute(
      "insert into edits (id, edits, file) values (?1, ?2, ?3)",
      (&uid, &edits, &hash),
    )?;

    Ok(())
  }

  pub async fn insert_file(self: &Self, hash: &str, rating: i32) -> Result<(), rusqlite::Error> {
    self.connection.as_ref().unwrap().execute(
      "insert into files (hash, rating) values (?1, ?2)",
      (&hash, &rating),
    )?;

    Ok(())
  }

  pub async fn get_edits(self: &Self, hash: &str) -> Result<Vec<Edit>, rusqlite::Error> {
    let con = self.connection.as_ref().unwrap();
    let mut stmt = con.prepare("select id, edits, file from edits where file = :hash")?;

    let rows = stmt.query_map(&[(":hash", &hash)], |row| {
      Ok(Edit {
        id: row.get(0)?,
        edits: row.get(1)?,
        file: row.get(2)?,
      })
    })?;

    let list: Vec<Edit> = rows.map(|v| v.unwrap()).collect();
    return Ok(list);
  }

  pub async fn get_file(self: &Self, hash: &str) -> Result<Vec<File>, rusqlite::Error> {
    let con = self.connection.as_ref().unwrap();
    let mut stmt = con.prepare("select hash, rating from files where hash = :hash")?;

    let rows = stmt.query_map(&[(":hash", &hash)], |row| {
      Ok(File {
        hash: row.get(0)?,
        rating: row.get(1)?,
      })
    })?;

    let list: Vec<File> = rows.map(|v| v.unwrap()).collect();
    return Ok(list);
  }

  pub async fn insert_location(self: &Self, name: &str, path: &str) -> Result<(), rusqlite::Error> {
    let uid = uuid::Uuid::new_v4().to_string();

    self.connection.as_ref().unwrap().execute(
      "insert into locations (id, name, path) values (?1, ?2, ?3)",
      (&uid, &name, &path),
    )?;

    Ok(())
  }

  pub fn location_list(self: &Self) -> Result<Vec<Location>, rusqlite::Error> {
    let con = self.connection.as_ref().unwrap();
    let mut stmt = con.prepare("select id, name, path from locations")?;

    let rows = stmt.query_map([], |row| {
      Ok(Location {
        id: row.get(0)?,
        name: row.get(1)?,
        path: row.get(2)?,
      })
    })?;

    let list: Vec<Location> = rows.map(|v| v.unwrap()).collect();
    return Ok(list);
  }

  pub fn tags_list(self: &Self) -> Result<Vec<Tag>, rusqlite::Error> {
    let con = self.connection.as_ref().unwrap();
    let mut stmt = con.prepare("select id, name from tags")?;

    let rows = stmt.query_map([], |row| {
      Ok(Tag {
        id: row.get(0)?,
        name: row.get(1)?,
      })
    })?;

    let list: Vec<Tag> = rows.map(|v| v.unwrap()).collect();
    return Ok(list);
  }
}
