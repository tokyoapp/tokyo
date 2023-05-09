import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { LastOpened } from "./components/LastOpened.jsx";

function App() {
  return (
    <gyro-layout>
      <gyro-layout-column>
        <gyro-group>
          <gyro-explorer tab="Explorer">
            <LastOpened />
          </gyro-explorer>
        </gyro-group>
        <gyro-group>
          <log-viewer tab="Log Viewer"></log-viewer>
        </gyro-group>
      </gyro-layout-column>
    </gyro-layout>
  );
}

function main() {
  render(() => <App />, document.getElementsByTagName("main")[0]);
}

main();
