import "@atrium-ui/elements/blur";
// import "@atrium-ui/elements/command";
import { type ParentProps, createSignal } from "solid-js";
import { t } from "tokyo-locales";
import Icon from "./Icon.jsx";
import Button from "./Button.jsx";
import { setSettingOpen, settingsOpen } from "../App.jsx";

const MacTitle = () => {
  const dot =
    "p-0 w-[14px] h-[14px] border border-zinc-800 hover:border-zinc-800 cursor-default";
  return (
    <div class="pointer-events-auto flex w-20 gap-[6px] px-2">
      {/* <button
        type="button"
        class={`${dot} hover:bg-red-700`}
        onClick={() => getCurrent().close()}
      />
      <button
        type="button"
        class={`${dot} hover:bg-yellow-400`}
        onClick={() => getCurrent().minimize()}
      />
      <button
        type="button"
        class={`${dot} hover:bg-green-700`}
        onClick={() => getCurrent().toggleMaximize()}
      /> */}
    </div>
  );
};

const WindowsTitle = () => {
  const dot =
    "p-0 w-[45px] h-[32px] rounded-none shadow-none border-none hover:bg-zinc-800 flex items-center justify-center";
  return (
    <div class="pointer-events-auto flex">
      <button
        type="button"
        class={`${dot}`}
        onClick={() => appWindow.minimize()}
      >
        <Icon name="ph-arrows-in-simple" />
      </button>
      <button
        type="button"
        class={`${dot}`}
        onClick={() => appWindow.toggleMaximize()}
      >
        <Icon name="ph-corners-out" />
      </button>
      <button type="button" class={`${dot}`} onClick={() => appWindow.close()}>
        <Icon name="ph-x" />
      </button>
    </div>
  );
};

export const [cmdOpen, setCmdOpen] = createSignal(false);

export default function Titlebar(props: { style: string } & ParentProps) {
  return (
    <>
      <div
        data-tauri-drag-region
        class="relative z-50 flex items-start justify-between border-zinc-800 border-b bg-[rgba(24,24,27,0.9)]"
      >
        <div class="pointer-events-none grid w-full grid-cols-[350px_1fr_350px] items-center px-2 py-1 text-xs text-zinc-500">
          <div class="flex items-center gap-4">
            {props.style === "macos" ? <MacTitle /> : null}

            <Button
              label="Settings"
              variant="square"
              onClick={() => {
                setSettingOpen(!settingsOpen());
              }}
            >
              <div
                class={`flex items-center justify-center transition-transform duration-100${
                  settingsOpen() ? "rotate-90" : "rotate-0"
                }`}
              >
                <Icon name="cogwheel" />
              </div>
            </Button>

            <div />
            <div>
              {props.children}

              {/* {location() */}
              {/*   .path.split('/') */}
              {/*   .slice(1) */}
              {/*   .map((part, i) => { */}
              {/*     if (i >= 1) { */}
              {/*       return ( */}
              {/*         <> */}
              {/*           <span>/</span> */}
              {/*           <Combobox class="px-1 pointer-events-auto" items={[]} title={part}> */}
              {/*             <span>{part}</span> */}
              {/*             <Icon class="pl-2" name="expand-down" /> */}
              {/*           </Combobox> */}
              {/*         </> */}
              {/*       ); */}
              {/*     } */}
              {/*     return <span>/{part}</span>; */}
              {/*   })} */}
            </div>
          </div>
          <div class="justify-self-center">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              class="pointer-events-auto w-80 border-zinc-800 bg-[#151517] py-[5px] text-zinc-500 shadow-none"
            >
              <span>{t("search")}</span>
              <Icon class="px-2" name="ph-magnifying-glass" />
            </button>
          </div>
          <div />
        </div>

        {props.style === "windows" ? <WindowsTitle /> : null}
      </div>

      {cmdOpen() ? (
        <a-blur
          enabled
          onBlur={() => setCmdOpen(false)}
          class="fixed top-0 left-0 z-50 flex h-1/2 w-full items-center justify-center"
        >
          <a-command placeholder="Search" class="pointer-events-auto">
            <div class="prefix" slot="before-input">
              <Icon name="ph-arrow-right" />
            </div>

            <div class="item [&[selected]]:bg-white">Some Item 1</div>
            <div class="item [&[selected]]:bg-white">Some Item 1</div>
            <div class="item [&[selected]]:bg-white">Some Item 1</div>
            <div class="item [&[selected]]:bg-white">Some Item 1</div>
            <div class="item [&[selected]]:bg-white">Some Item 1</div>
          </a-command>
        </a-blur>
      ) : null}
    </>
  );
}
