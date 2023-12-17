use anyhow::Result;
use libsql_client::{args, Client, Config, Statement};
use std::env;

async fn run() -> Result<()> {
  let remote_config = Config {
    url: url::Url::parse(env::var("DATABASE").expect("No Database").as_str()).unwrap(),
    auth_token: env::var("TURSO_AUTH_TOKEN").ok(),
  };

  print!("{:?}", remote_config);

  let local_config = Config {
    url: url::Url::parse("file:////tmp/example.db").unwrap(),
    auth_token: None,
  };

  let client = Client::from_config(local_config).await.unwrap();

  // let rss = client
  //   .batch([Statement::with_args(
  //     "insert into example_users values (?, ?)",
  //     args!("uid3", "uid3@turso.tech"),
  //   )])
  //   .await?;

  let rs = client
    .execute(Statement::with_args(
      "select * from example_users where uid = ?",
      args!("uid3"),
    ))
    .await?;

  println!("Result: {:?}", rs);

  Ok(())
}

#[tokio::main]
async fn main() {
  run().await.expect("Error");
}
