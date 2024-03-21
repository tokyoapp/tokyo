use log::error;
use walkdir::WalkDir;

pub fn list(dir: String) -> Vec<String> {
  let mut entries: Vec<String> = Vec::new();

  for entry in WalkDir::new(dir).follow_links(true) {
    match entry {
      Ok(file) => {
        let file = process_entry(file);
        match file {
          Some(file) => entries.push(file),
          None => {}
        }
      }
      Err(error) => error!("Problem opening the file: {:?}", error),
    };
  }

  return entries;
}

fn process_entry(entry: walkdir::DirEntry) -> Option<String> {
  let name = entry.file_name().to_str().unwrap();
  let parts = name.split(".");
  let ext = parts.last().unwrap();

  match ext.to_lowercase().as_str() {
    "cr3" => return Some(entry.path().to_str().unwrap().to_owned()),
    "cr2" => return Some(entry.path().to_str().unwrap().to_owned()),
    "arw" => return Some(entry.path().to_str().unwrap().to_owned()),
    "tif" => return Some(entry.path().to_str().unwrap().to_owned()),
    "jpg" => return Some(entry.path().to_str().unwrap().to_owned()),
    "png" => return Some(entry.path().to_str().unwrap().to_owned()),
    &_ => return None,
  }
}
