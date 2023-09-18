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
  pub edits: Vec<i32>,
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

  pub async fn create_location(self: &Self, name: &str, path: &str) -> Result<(), rusqlite::Error> {
    let uid = uuid::Uuid::new_v4().to_string();

    self.connection.as_ref().unwrap().execute(
      "insert into libraries (id, name, path) values (?1, ?2, ?3)",
      (&uid, &name, &path),
    )?;

    Ok(())
  }

  pub fn location_list(self: &Self) -> Result<Vec<Location>, rusqlite::Error> {
    let con = self.connection.as_ref().unwrap();
    let mut stmt = con.prepare("select id, name, path from libraries")?;

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

  pub async fn init_db(self: &Self) -> Result<(), rusqlite::Error> {
    let query = "
      create table if not exists libraries (id TEXT, name TEXT, path TEXT);
    ";
    let con = self.connection.as_ref().unwrap();
    con.execute(query, ())?;

    let list = self.location_list()?;
    if list.len() == 0 {
      self
        .create_location("default", "/Users/tihav/Pictures")
        .await?;
    }

    return Ok(());
  }
}
