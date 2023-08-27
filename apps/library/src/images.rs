use walkdir::WalkDir;

fn walk(dir: String) -> Vec<String> {
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
            Err(error) => println!("Problem opening the file: {:?}", error),
        };
    }

    return entries;
}

fn process_entry(entry: walkdir::DirEntry) -> Option<String> {
    let name = entry.file_name().to_str().unwrap();
    let parts = name.split(".");
    let ext = parts.last().unwrap();

    // if metadata.is_file() && metadata.file_type()

    match ext.to_lowercase().as_str() {
        "cr3" => return Some(entry.file_name().to_str().unwrap().to_owned()),
        "jpg" => return Some(entry.file_name().to_str().unwrap().to_owned()),
        "png" => return Some(entry.file_name().to_str().unwrap().to_owned()),
        &_ => return None,
    }
}

pub fn list(dir: String) -> String {
    walk(dir).join(", ")
}
