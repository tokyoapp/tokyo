import { setSettingOpen, settingsOpen } from "../App.jsx";
import Button from "./ui/Button.jsx";
import Icon from "./ui/Icon.jsx";

export function ActivityBar() {
  return (
    <div class="activity-bar flex flex-col gap-3 border-zinc-800 border-r px-3 py-3">
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
          <Icon name="chevron-right" />
        </div>
      </Button>

      <hr />

      <Button label="Tool 1" variant="square">
        <Icon />
      </Button>
      <Button label="Tool 2" variant="square">
        <Icon />
      </Button>
      <Button label="Tool 3" variant="square">
        <Icon />
      </Button>
    </div>
  );
}
