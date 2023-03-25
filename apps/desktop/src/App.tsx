import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

import "view-canvas";

function App() {
  const [greetMsg, setGreetMsg] = createSignal("");
  const [name, setName] = createSignal("");

  async function openViewer() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("open_viewer"));
  }

  return (
    <div class="app">
      <div class="panel">
        <canvas-element controls></canvas-element>
      </div>
      <div class="panel">
        <div class="properties">
          <button onclick={openViewer}>Open Viewer</button>
        </div>
      </div>
    </div>
  );
}

export default App;
