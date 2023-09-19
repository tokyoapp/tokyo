mod db;

use tokio;

#[tokio::main]
async fn main() {
  let mut root = db::Root::new();

  root.connect().await;
  root.init_db().await;

  root.insert_file("123", 0).await;

  root.set_rating("123", 3).await;

  let tag = root.insert_tag("photo").await.unwrap();
  println!("inserted tag {:?}", tag);

  let mut f = root.get_file("123").await.unwrap();

  if let Some(file) = f.first_mut() {
    file.tags.push(tag);

    println!("set tgs {:?}", file.tags);
    root.set_tags("123", file.tags.clone()).await;
  }

  root.insert_edit("123", "{}").await;

  let edits = root.get_edits("123").await;

  println!("EDITS {:?}", edits);

  let file = root.get_file("123").await.unwrap();
  println!("FILE {:?}", file);

  let tags = root.tags_list().unwrap();
  println!("TAGS {:?}", tags);
}
