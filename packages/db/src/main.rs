use anyhow::Result;
use libsql_client::{args, Client, Config, Statement};

async fn run() -> Result<()> {
  let remote_config = Config {
    url: url::Url::parse("libsql://clean-cannonball-luckydye.turso.io").unwrap(),
    auth_token: Some("eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOiIyMDIzLTEyLTE1VDEyOjIwOjE3LjQxNTgyNTIzOFoiLCJpZCI6ImQxNWE2ZDQyLTIxOGUtMTFlZS1hMzc1LTU2NGE0NjNkNjZmMSJ9.ICHp7zQB10lGAshwDe9HmEZaULdT9_f6MJ0gEv3xYgOH1C6qJePgBX_XnjHP_oIrgyQ4ODt5MIhd2lceXYw4Cg".to_string()),
  };

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
