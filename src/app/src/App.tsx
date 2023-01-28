import type { Component } from "solid-js";

import styles from "./App.module.css";

const App: Component = () => {
  return (
    <div class={styles.App}>
      <app-state scope="media">
        <div state-key="innerHTML:items"></div>
      </app-state>
      <br />
      <div>
        <action-button action="captureScreen">Start Capture</action-button>
        <action-button action="stopCapture">Stop Capture</action-button>
        <action-button action="saveAs">Save</action-button>
        <action-button action="convert">Convert</action-button>
      </div>

      <div id="root"></div>

      <file-dropzone></file-dropzone>
    </div>
  );
};

export default App;
