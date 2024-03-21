use anyhow::anyhow;
use bytes::Bytes;
use log::error;
use reqwest::Response;
use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct Storage {
  pub name: String,
  pub path: String,
  pub accesscapability: String,
  pub maxsize: usize,
  pub spacesize: usize,
  pub contentsnumber: usize,
}

#[derive(Deserialize, Debug)]
pub struct StorageList {
  pub storagelist: Vec<Storage>,
}

#[derive(Deserialize, Debug)]
pub struct Folder {
  pub path: Vec<String>,
}

#[derive(Deserialize, Debug)]
pub struct Info {
  pub protect: String,
  pub archive: String,
  pub rotate: String,
  pub rating: String,
  pub lastmodifieddate: String,
  pub hdr: String,
  pub playtime: Option<String>,
  pub filesize: usize,
}

#[derive(Deserialize, Debug)]
pub struct Endpoint {
  pub path: String,
  pub post: Option<bool>,
  pub get: Option<bool>,
}

#[derive(Deserialize, Debug)]
pub struct Index {
  pub ver100: Option<Vec<Endpoint>>,
  pub ver110: Option<Vec<Endpoint>>,
}

pub struct CCAPI {
  host: String,
}

static APP_USER_AGENT: &str = concat!(env!("CARGO_PKG_NAME"), "/", env!("CARGO_PKG_VERSION"),);

impl CCAPI {
  pub fn new(host: &str) -> CCAPI {
    CCAPI {
      host: host.to_string(),
    }
  }

  async fn fetch(&self, endpoint: &str) -> Result<Response, anyhow::Error> {
    let request_url = format!("http://{}{}", self.host, endpoint);
    let client = reqwest::Client::builder()
      .user_agent(APP_USER_AGENT)
      .build()?;

    let response = client.get(&request_url).send().await?;

    if response.status() != 200 {
      let txt = response.text().await?;
      error!("Error: {:?}", txt);
      return Err(anyhow!("Error: {:?}", txt).into());
    }

    Ok(response)
  }

  pub async fn index(&self) -> Result<Index, anyhow::Error> {
    let res = self.fetch("/ccapi").await?;
    let index = res.json::<Index>().await?;

    Ok(index)
  }

  pub async fn storage(&self) -> Result<StorageList, anyhow::Error> {
    let res = self.fetch("/ccapi/ver110/devicestatus/storage").await?;
    let storage = res.json::<StorageList>().await?;

    Ok(storage)
  }

  pub async fn files(&self, storage: &Storage) -> Result<Vec<String>, anyhow::Error> {
    let folders = self.fetch(&storage.path).await?;
    let folders = folders.json::<Folder>().await?;

    let mut file_paths = Vec::new();
    for folder in folders.path {
      let files = self.fetch(&folder).await?;
      let files = files.json::<Folder>().await?;

      for file in files.path {
        file_paths.push(file);
      }
    }

    Ok(file_paths)
  }

  pub async fn info(&self, file_path: &str) -> Result<Info, anyhow::Error> {
    let res = self.fetch(&format!("{}?kind=info", file_path)).await?;
    let info = res.json::<Info>().await?;
    Ok(info)
  }

  pub async fn thumbnail(&self, file_path: &str) -> Result<Bytes, anyhow::Error> {
    let res = self.fetch(&format!("{}?kind=thumbnail", file_path)).await?;
    let data = res.bytes().await?;
    Ok(data)
  }

  pub async fn original(&self, file_path: &str) -> Result<Bytes, anyhow::Error> {
    let res = self.fetch(file_path).await?;
    let data = res.bytes().await?;
    Ok(data)
  }
}

#[tokio::test]
async fn my_test() -> Result<(), anyhow::Error> {
  let api = CCAPI::new("127.0.0.1:3000");

  let storage = api.storage().await?;
  let res = api.files(&storage.storagelist[0]).await?;
  let file = &res[0];
  let info = api.info(file).await?;

  let original = api.original(file).await?;

  std::fs::write("original.CR3", original)?;

  println!("{:?}", info);

  Ok(())
}
