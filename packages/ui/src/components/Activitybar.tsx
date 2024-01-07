import Button from './ui/Button.jsx';
import Icon from './ui/Icon.jsx';
import { setSettingOpen, settingsOpen } from '../App.jsx';

export function ActivityBar() {
  return (
    <div class="activity-bar py-3 px-3 border-r border-zinc-800 flex flex-col gap-3">
      <Button
        label="Settings"
        variant="square"
        onClick={() => {
          setSettingOpen(!settingsOpen());
        }}
      >
        <div
          class={`flex items-center justify-center duration-100 transition-transform ${
            settingsOpen() ? 'rotate-90' : 'rotate-0'
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
