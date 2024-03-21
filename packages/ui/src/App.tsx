import { platform } from "@tauri-apps/plugin-os";
import { ErrorBoundary, createSignal } from "solid-js";
import type { IndexEntryMessage } from "tokyo-proto";
import Jobs from "./actions/Action.ts";
import { ActivityBar } from "./components/Activitybar.jsx";
import Explorer from "./components/Explorer";
import LocationSettings from "./components/LocationSettings.jsx";
import { Properties } from "./components/Properties.tsx";
import Titlebar from "./components/Titlebar.jsx";
import Preview from "./components/Viewer";
import { Notifications } from "./components/notifications/Notifications.ts";
import { Basic } from "./properties/Basic.ts";

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

            <notification-feed class="-translate-x-1/2 fixed top-20 left-1/2 z-10 w-80" />

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

      <notification-feed class="-translate-x-1/2 fixed top-20 left-1/2 z-50 w-80" />

      <div class="grid grid-cols-[auto_1fr]">
        <ActivityBar />

        <div
          class={`relative grid h-full w-full${
            file() ? "grid-cols-[250px_1.25fr_300px]" : "grid-cols-1"
          }`}
        >
          <div class="relative">
            <div class="absolute top-0 left-0 h-full w-full">
              {settingsOpen() ? (
                <div class="absolute top-0 left-0 z-40 h-full w-full">
                  <LocationSettings />
                </div>
              ) : null}

              <Explorer small={!!file()} />
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
    </ErrorBoundary>
  );
}
