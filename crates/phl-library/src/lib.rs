mod db;
mod images;

use rusqlite::{Connection, Result};

#[derive(Debug, serde::Serialize, Clone)]
pub struct Library {
    pub name: String,
    pub path: String,
}

pub fn list(dir: String) -> Vec<String> {
    return images::list(dir);
}

fn db() -> Connection {
    Connection::open("./data/db.sqlite").expect("Failed to open database")
}

pub fn default_library() -> Result<Library> {
    return Ok(lib_list()?.first().unwrap().clone());
}

pub fn create_library(name: &str, path: &str) {
    let con = db();
    con.execute("insert into libraries values (?1, ?2)", (&name, &path))
        .unwrap();
}

pub fn lib_list() -> Result<Vec<Library>, rusqlite::Error> {
    let con = db();
    let mut stmt = con.prepare("select * from libraries")?;

    let rows = stmt.query_map([], |row| {
        Ok(Library {
            name: row.get(0)?,
            path: row.get(1)?,
        })
    })?;

    let list: Vec<Library> = rows.map(|v| v.unwrap()).collect();
    return Ok(list);
}

pub fn create_root_library() -> Result<()> {
    let con = db();

    let query = "create table if not exists libraries (name TEXT, path TEXT);";
    con.execute(query, ())?;

    let list = lib_list()?;
    if list.len() == 0 {
        create_library("Default", "/Users/tihav/Pictures");
    }

    return Ok(());
}
