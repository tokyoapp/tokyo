use serde::de::DeserializeOwned;
use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Runtime,
};

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "com.luckydye.plugin.library";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_library);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
  _app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> crate::Result<Library<R>> {
  #[cfg(target_os = "android")]
  let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "ExamplePlugin")?;
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init_plugin_library)?;
  Ok(Library(handle))
}

/// Access to the library APIs.
pub struct Library<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> Library<R> {
  // TODO: implement mobile methods

  // pub fn get_locations(&self) -> crate::Result<Vec<tokyo_library::db::Location>> {
  //   let x = self
  //     .0
  //     .run_mobile_plugin("get_locations")
  //     .map_err(Into::into);

  //   let root = db::Root::new().await;
  //   return Ok(root.location_list().await.unwrap());
  // }

  // pub async fn get_index(&self, name: String) -> crate::Result<Vec<tokyo_library::IndexEntry>> {
  //   let root = db::Root::new().await;
  //   let dir = tokyo_library::Library::find_library(&root, name.as_str())
  //     .unwrap()
  //     .path;
  //   let index = tokyo_library::Library::get_index(&root, dir).await;
  //   return Ok(index);
  // }

  // pub async fn get_metadata(&self, file_path: String) -> crate::Result<tokyo_library::MetadataEntry> {
  //   let root = db::Root::new().await;
  //   let meta = tokyo_library::Library::metadata(&root, &file_path).await;
  //   if let Some(metadata) = meta {
  //     return Ok(metadata);
  //   }
  //   Err(crate::Error::Unknown("metadata".to_string()))
  // }

  // pub async fn get_system(&self) -> crate::Result<tokyo_library::SystemInfo> {
  //   return Ok(tokyo_library::Library::sysinfo());
  // }

  pub async fn create_library(&self) {}

  pub async fn get_image(&self) {}

  pub async fn post_metadata(&self) {}
}
