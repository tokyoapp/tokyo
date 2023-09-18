mod db;

use tokio;

async fn do_thing() {
  let mut root = db::Root::new();

  root.connect().await;
  root.init_db().await;

  println!("List locations:");
  println!("{:?}", root.location_list());
}

#[tokio::main]
async fn main() {
  do_thing().await;
}
