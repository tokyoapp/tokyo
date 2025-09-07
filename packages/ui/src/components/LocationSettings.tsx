import { AVAILABLE_LANGS } from "tokyo-locales";
import { setSettingOpen } from "../App.jsx";
import Button from "./Button.jsx";
import Icon from "./Icon.jsx";
import Select from "./Select.jsx";

export default function () {
  return (
    <div class="grid h-full w-full grid-cols-[150px_1fr] grid-rows-[auto_1fr] bg-[#18191BEE] p-8 backdrop-blur-xl">
      <div class="col-span-2 flex items-center justify-between pb-8">
        <h1 class="font-thin text-4xl">Locations</h1>

        <Button variant="ghost" onClick={() => setSettingOpen(false)}>
          <Icon name="close" />
        </Button>
      </div>

      <nav>
        <div>
          <span>Libraries</span>
        </div>
        <div>
          <span>Ingest</span>
        </div>
        <div>
          <span>Export</span>
        </div>
      </nav>

      <div>
        <Select
          items={Object.keys(AVAILABLE_LANGS).map((lang) => ({
            id: lang,
            value: lang,
          }))}
          onChange={(value) => {
            // setLanguage(value);
          }}
        >
          Language: {"en"}
        </Select>

        <br />
        <br />

        <Button onClick={() => {}}>Reset Cache</Button>
      </div>
    </div>
  );
}
