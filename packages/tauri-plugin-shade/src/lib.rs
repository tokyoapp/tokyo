use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;
use tauri::{Manager, State};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command};
use log;
use tokio::sync::Mutex;
use tokio::io::AsyncReadExt;
use tauri::ipc::Response;
use tauri::{
  plugin::{Builder, TauriPlugin},
  Runtime,
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::Shade;
#[cfg(mobile)]
use mobile::Shade;

use crate::commands::{get_image, shade, shade_status, start_shade_process, stop_shade, ShadeProcess};

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the shade APIs.
pub trait ShadeExt<R: Runtime> {
  fn shade(&self) -> &Shade<R>;
}

impl<R: Runtime, T: Manager<R>> crate::ShadeExt<R> for T {
  fn shade(&self) -> &Shade<R> {
    self.state::<Shade<R>>().inner()
  }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
  Builder::new("shade")
    .invoke_handler(tauri::generate_handler![
      shade,
      shade_status,
      get_image,
    ])
    .setup(|app, api| {
      app.manage(Arc::new(Mutex::new(ShadeProcess::new())));

      // Start the shade process on app startup
      let app_handle = app.clone();
      tauri::async_runtime::spawn(async move {
        let state: State<Arc<Mutex<ShadeProcess>>> = app_handle.state();
        if let Err(e) = start_shade_process(state.clone()).await {
          log::info!("Failed to start shade process: {}", e);
        }

        shade("initialize", state.clone(), serde_json::json!({ })).await.expect("shade init failed");
      });

      // app_handle.on_window_event(|window, event| {
      //   if let tauri::WindowEvent::CloseRequested { .. } = event {
      //     // Cleanup shade process on app close
      //     let app_handle = window.app_handle();
      //     let state: State<Arc<Mutex<ShadeProcess>>> = app_handle.state();
      //     tauri::async_runtime::block_on(async move {
      //       let _ = stop_shade(state).await;
      //     });
      //   }
      // });

      Ok(())
    })
    .build()
}
