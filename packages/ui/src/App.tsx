import { platform } from "@tauri-apps/plugin-os";
import { ErrorBoundary, createSignal } from "solid-js";
import type { IndexEntryMessage } from "tokyo-schema";
import Jobs from "./actions/Action.ts";
import { ExplorerView } from "./components/Explorer";
import LocationSettings from "./components/LocationSettings.jsx";
import { Properties } from "./components/Properties.tsx";
import Titlebar from "./components/Titlebar.jsx";
import Preview from "./components/Viewer";
import { Notifications } from "./components/Notifications.ts";
import { Basic } from "./properties/Basic.ts";
import "./App.css";

export const [settingsOpen, setSettingOpen] = createSignal(false);

export const [file, setFile] = createSignal<IndexEntryMessage>();

const models = {
  basic: new Basic(),
};

const shortcuts: Record<string, () => void> = {
  r: Jobs.map("reload"),
  p: Jobs.map("search"),
};

window.addEventListener("keyup", (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key in shortcuts) shortcuts[e.key]();
  }
});

export default function App() {
  window.addEventListener("error", (e) => {
    Notifications.error(e.message || e.detail);
  });

  const [os, setOS] = createSignal("macos");

  if ("__TAURI_INVOKE__" in window) {
    platform()
      .then((os) => {
        console.info(os);
        setOS(os);
      })
      .catch((err) => {
        console.error("Platform Error", err);
        return undefined;
      });
  }

  return (
    <ErrorBoundary
      fallback={(err: Error) => {
        console.error(err);
        return (
          <>
            <Titlebar style={os()} />

            <notification-feed class="fixed left-1/2 top-20 z-10 w-80 -translate-x-1/2" />

            <div
              class={`relative grid h-full w-full p-10${
                file() ? "grid-cols-[250px_1.25fr_300px]" : "grid-cols-1"
              }`}
            >
              <div>
                <h1 class="pb-4 text-2xl">Unknown Error</h1>
                <pre class="pb-2">{err.toString()}</pre>
                <pre class="text-xs">{err.stack}</pre>
              </div>
            </div>
          </>
        );
      }}
    >
      <Titlebar style={os()} />

      <notification-feed class="fixed left-1/2 top-20 z-50 w-80 -translate-x-1/2" />

      <div class="grid grid-cols-[1fr]">
        <div
          class={`relative grid h-full w-full ${
            file() ? "grid-cols-[250px_1.25fr_300px]" : "grid-cols-1"
          }`}
        >
          <div class="relative">
            <div class="absolute left-0 top-0 h-full w-full">
              <ExplorerView />
            </div>
          </div>

          {file() ? (
            <>
              <div class="relative flex flex-col items-center justify-center">
                <Preview
                  models={models}
                  file={file()}
                  onClose={() => setFile(undefined)}
                />
              </div>

              <Properties models={models} file={file()} />
            </>
          ) : null}
        </div>
      </div>

      {settingsOpen() ? (
        <div class="absolute left-1/2 top-1/2 z-40 w-[800px] h-[800px] rounded-xl -translate-1/2 bg-zinc-700">
          <LocationSettings />
        </div>
      ) : null}
    </ErrorBoundary>
  );
}
