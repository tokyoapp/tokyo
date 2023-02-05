import type { Component } from "solid-js";

import styles from "./Evolution.module.css";

import "./Button";
import "./ActionButton";
import "./FileDropzone";

const Evolution: Component = () => {
  return (
    <div class={styles.App}>
      <div>
        <action-button action="captureScreen">Start Capture</action-button>
        <action-button action="stopCapture">Stop Capture</action-button>
        <action-button action="saveAs">Save</action-button>
        <action-button action="convert">Convert</action-button>
      </div>

      <file-dropzone></file-dropzone>
    </div>
  );
};

export default Evolution;
