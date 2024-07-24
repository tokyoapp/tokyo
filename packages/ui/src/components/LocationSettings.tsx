// import { langs, language, setLanguage } from "tokyo-locales";
// import storage from '../services/ClientStorage.worker.ts';
import { setSettingOpen } from "../App.jsx";
import Button from "./ui/Button.jsx";
import Icon from "./ui/Icon.jsx";
import Select from "./ui/Select.jsx";

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
          items={Object.keys(langs).map((lang) => ({ id: lang, value: lang }))}
          onChange={(value) => {
            // setLanguage(value);
          }}
        >
          Language: {"en"}
        </Select>

        <br />
        <br />

        <Button onClick={() => storage.reset()}>Reset Cache</Button>
      </div>
    </div>
  );
}
