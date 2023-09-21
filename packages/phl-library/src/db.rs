use rusqlite::params;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
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

pub struct Root {
  connection: Connection,
}

unsafe impl Sync for Root {}

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

    if !Path::exists(&Path::new("./data/")) {
      println!("Path for data exists");
      fs::create_dir("./data/").expect("Unable to create dir './data/'");
    }

    let connection = Connection::open("./data/db.sqlite").expect("Failed to open db");
    let root = Root { connection };

    return root;
  }

  pub fn init_db(self: &Self) -> Result<(), rusqlite::Error> {
    let con = &self.connection;

    // table: locations
    con.execute(
      "create table if not exists locations (id TEXT PRIMARY KEY, name TEXT, path TEXT);",
      (),
    )?;

    // table: files
    con.execute(
      "create table if not exists files (hash TEXT PRIMARY KEY, tags TEXT, rating INTEGER);",
      (),
    )?;

    // table: presets
    con.execute(
      "create table if not exists presets (id TEXT PRIMARY KEY, edits INTEGER);",
      (),
    )?;

    // table: edits
    con.execute(
      "create table if not exists edits (id TEXT PRIMARY KEY, edits TEXT, file TEXT);",
      (),
    )?;

    // table: set
    con.execute(
      "create table if not exists sets (id TEXT PRIMARY KEY, tags TEXT, rating INTEGER);",
      (),
    )?;

    // table: tags
    con.execute(
      "create table if not exists tags (id TEXT PRIMARY KEY, name TEXT);",
      (),
    )?;

    let list = self.location_list()?;
    if list.len() == 0 {
      self.insert_location("default", "/Users/tihav/Pictures")?;
    }

    return Ok(());
  }

  pub fn insert_tag(self: &Self, name: &str) -> Result<String, rusqlite::Error> {
    let uid = uuid::Uuid::new_v4().to_string();

    self
      .connection
      .execute("insert into tags (id, name) values (?1, ?2)", (&uid, &name))?;

    Ok(uid)
  }

  pub async fn insert_edit(self: &Self, hash: &str, edits: &str) -> Result<(), rusqlite::Error> {
    let uid = uuid::Uuid::new_v4().to_string();

    self.connection.execute(
      "insert into edits (id, edits, file) values (?1, ?2, ?3)",
      (&uid, &edits, &hash),
    )?;

    Ok(())
  }

  pub fn insert_file(self: &Self, hash: &str, rating: i32) -> Result<(), rusqlite::Error> {
    self.connection.execute(
      "insert into files (hash, rating, tags) values (?1, ?2, ?3)",
      (&hash, &rating, &""),
    )?;

    Ok(())
  }

  pub async fn get_edits(self: &Self, hash: &str) -> Result<Vec<Edit>, rusqlite::Error> {
    let con = &self.connection;
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

  pub fn get_file(self: &Self, hash: &str) -> Result<Vec<File>, rusqlite::Error> {
    let con = &self.connection;
    let mut stmt = con.prepare("select hash, tags, rating from files where hash = :hash")?;

    let rows = stmt.query_map(&[(":hash", &hash)], |row| {
      let tags: String = row.get(1)?;

      Ok(File {
        hash: row.get(0)?,
        tags: tags.split(",").map(|str| String::from(str)).collect(),
        rating: row.get(2)?,
      })
    })?;

    let list: Vec<File> = rows.map(|v| v.unwrap()).collect();
    return Ok(list);
  }

  pub async fn set_rating(self: &Self, hash: &str, rating: i32) -> Result<(), rusqlite::Error> {
    self.connection.execute(
      "update files SET rating = ?1 where hash = ?2",
      params![rating, hash],
    )?;

    Ok(())
  }

  pub fn set_tags(self: &Self, hash: &str, tags: &Vec<String>) -> Result<(), rusqlite::Error> {
    let ts = tags.join(",");

    self.connection.execute(
      "update files SET tags = ?1 where hash = ?2",
      params![ts, hash],
    )?;

    Ok(())
  }

  pub fn insert_location(self: &Self, name: &str, path: &str) -> Result<(), rusqlite::Error> {
    let uid = uuid::Uuid::new_v4().to_string();

    self.connection.execute(
      "insert into locations (id, name, path) values (?1, ?2, ?3)",
      (&uid, &name, &path),
    )?;

    Ok(())
  }

  pub fn location_list(self: &Self) -> Result<Vec<Location>, rusqlite::Error> {
    let con = &self.connection;
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
    let con = &self.connection;
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
