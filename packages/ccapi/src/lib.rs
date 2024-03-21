use anyhow::anyhow;
use bytes::Bytes;
use reqwest::Response;
use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct Storage {
  name: String,
  path: String,
  accesscapability: String,
  maxsize: usize,
  spacesize: usize,
  contentsnumber: usize,
}

#[derive(Deserialize, Debug)]
struct StorageList {
  storagelist: Vec<Storage>,
}

#[derive(Deserialize, Debug)]
struct Folder {
  path: Vec<String>,
}

#[derive(Deserialize, Debug)]
struct Info {
  protect: String,
  archive: String,
  rotate: String,
  rating: String,
  lastmodifieddate: String,
  hdr: String,
  playtime: Option<String>,
  filesize: usize,
}

#[derive(Deserialize, Debug)]
struct Endpoint {
  path: String,
  post: Option<bool>,
  get: Option<bool>,
}

#[derive(Deserialize, Debug)]
struct Index {
  ver100: Option<Vec<Endpoint>>,
  ver110: Option<Vec<Endpoint>>,
}

struct CCAPI {
  host: String,
}

static APP_USER_AGENT: &str = concat!(env!("CARGO_PKG_NAME"), "/", env!("CARGO_PKG_VERSION"),);

impl CCAPI {
  fn new(host: &str) -> CCAPI {
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
      println!("Error: {:?}", txt);
      return Err(anyhow!("Error: {:?}", txt).into());
    }

    Ok(response)
  }

  async fn index(&self) -> Result<Index, anyhow::Error> {
    let res = self.fetch("/ccapi").await?;
    let index = res.json::<Index>().await?;

    Ok(index)
  }

  async fn storage(&self) -> Result<StorageList, anyhow::Error> {
    let res = self.fetch("/ccapi/ver110/devicestatus/storage").await?;
    let storage = res.json::<StorageList>().await?;

    Ok(storage)
  }

  async fn files(&self, storage: &Storage) -> Result<Vec<String>, anyhow::Error> {
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

  async fn info(&self, file_path: &str) -> Result<Info, anyhow::Error> {
    let res = self.fetch(&format!("{}?kind=info", file_path)).await?;
    let info = res.json::<Info>().await?;
    Ok(info)
  }

  async fn thumbnail(&self, file_path: &str) -> Result<Bytes, anyhow::Error> {
    let res = self.fetch(&format!("{}?kind=thumbnail", file_path)).await?;
    let data = res.bytes().await?;
    Ok(data)
  }

  async fn original(&self, file_path: &str) -> Result<Bytes, anyhow::Error> {
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
