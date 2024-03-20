use reqwest::Error;
use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct User {
  login: String,
  id: u32,
}

static APP_USER_AGENT: &str = concat!(env!("CARGO_PKG_NAME"), "/", env!("CARGO_PKG_VERSION"),);

async fn fetch(request_url: String) -> Result<(), Error> {
  let client = reqwest::Client::builder()
    .user_agent(APP_USER_AGENT)
    .build()?;

  let response = client.get(&request_url).send().await?;

  if response.status() != 200 {
    let txt = response.text().await?;
    println!("Error: {:?}", txt);
    return Ok(());
  }

  let users: Vec<User> = response.json().await?;
  println!("{:?}", users);

  Ok(())
}

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), Error> {
  let request_url = format!(
    "https://api.github.com/repos/{owner}/{repo}/stargazers",
    owner = "rust-lang-nursery",
    repo = "rust-cookbook"
  );

  fetch(request_url).await?;

  Ok(())
}
