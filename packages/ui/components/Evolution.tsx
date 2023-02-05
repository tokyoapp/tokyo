import type { Component } from "solid-js";
import Action from "core/actions";

import styles from "./Evolution.module.scss";

import "./Button";
import "./FileDropzone";
import "./RatioBox";

import Timeline from "./timeline/Timeline";

const capture = async () => {
  const canvas = await Action.run("captureScreen");
  document.querySelector("#preview").append(canvas);
};

const stop = () => {
  Action.run("stopCapture");
};

const Evolution: Component = () => {
  return (
    <>
      <div class={styles.App}>
        <ratio-box id="preview"></ratio-box>
        <div class="toolbar p-4">
          <evo-button on:click={capture}>Start Capture</evo-button>
          <evo-button on:click={stop}>Stop Capture</evo-button>
        </div>
        <div class="toolbar">
          <Timeline />
        </div>
      </div>

      <file-dropzone></file-dropzone>
    </>
  );
};

export default Evolution;
