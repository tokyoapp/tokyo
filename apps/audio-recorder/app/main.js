import Knob from "./components/Knob.js";
import { Action } from "./Actions.js";
import Preferences from "./app/Preferences.js";
import AudioChannel from "./audio/AudioChannel.js";
import { AudioClip } from "./audio/AudioClip.js";
import { AudioRecorder } from "./audio/AudioRecorder.js";
import AudioSource from "./audio/AudioSource.js";
import { AudioTrack } from "./audio/AudioTrack.js";
import { AudioTrackMixer } from "./audio/AudioTrackMixer.js";
import AudioUtils from "./audio/AudioUtils.js";
import AudioStreamMeter from "./components/AudioMeter.js";
import "./components/AudioMeterVertical.js";
import AudioTrackChannel from "./components/AudioTrackChannel.js";
import AudioTrackElement from "./components/AudioTrackElement.js";
import DropdownButton from "./components/DropdownButton.js";
import PlaybackControls from "./components/PlaybackControls.js";
import Timeline from "./components/Timeline.js";
import Timer from "./Timer.js";

Action.register({
  name: "playPause",
  description: "playPause",
  shortcut: "space",
  onAction(args, event, aciton) {
    if (Timer.playing) {
      Timer.pause();
    } else {
      Timer.play();
    }
  },
});

const audioContext = new AudioContext();

window.onclick = () => {
  audioContext.resume();
};

function monitorStream(stream, name, contianer) {
  const meter = new AudioStreamMeter(audioContext, name);
  meter.setSourceStream(stream);
  contianer.appendChild(meter);
}

function createControlKnob(source) {
  const knob = new Knob();

  knob.min = 0;
  knob.max = 20;
  knob.steps = 0.1;

  knob.setValue(source.getGain());

  knob.addEventListener("change", (e) => {
    source.setGain(knob.value);
  });

  return knob;
}

const tracks = [
  {
    name: "Track 1",
    armed: true,
  },
  {
    name: "Track 2",
    armed: true,
  },
  {
    name: "Track 3",
    armed: true,
  },
];

function loadMixerTracks(audioContext, mixer, jsonTracks) {
  for (let jsonTrack of jsonTracks) {
    const track1 = new AudioTrack(audioContext);
    track1.name = jsonTrack.name;
    track1.armed = jsonTrack.armed;
    mixer.addTrack(track1);

    const track = new AudioTrackElement(audioContext, track1);
    track.id = "tracksElement";
    track.inputDeviceId = jsonTrack.inputDevice;
    tracksEle.appendChild(track);

    const mixerTrack = new AudioTrackChannel(track1);
    mixerContainer.appendChild(mixerTrack);
  }
}

function featureDetectAsyncAwait() {
  let isAsync = true;

  try {
    eval("async () => {}");
  } catch (e) {
    if (e instanceof SyntaxError) isAsync = false;
    else throw e; // throws CSP error
  }
  return isAsync;
}

async function main() {
  console.log("initialising");

  const detectAwait = featureDetectAsyncAwait();
  console.log("async/await supported:", detectAwait);

  console.log("worklets:", audioContext.audioWorklet ? "yes" : "no");

  // setup audiocontext
  try {
    await audioContext.audioWorklet.addModule("./audio/audio-proxy.js");
    await audioContext.audioWorklet.addModule("./audio/audio-db-meter.js");
    await audioContext.audioWorklet.addModule("./audio/audio-composer.js");
    await audioContext.audioWorklet.addModule("./audio/audio-player.js");
    console.log("worklets loaded");
  } catch (err) {
    console.error("Worklets failed initilising");
  }

  //new routing
  const mixer = new AudioTrackMixer(audioContext);

  console.log("Mixer loaded");
  try {
    loadMixerTracks(audioContext, mixer, tracks);
  } catch (err) {
    console.error(err);
  }

  const mixOutNode = mixer.getOutputNode(audioContext);

  // init routing
  const masterChannel = new AudioChannel(audioContext);
  masterChannel.setInput(mixOutNode);

  const knob = createControlKnob(masterChannel);
  headerElement.appendChild(knob);

  const ui = makeUi();
  ui.onStart = () => {
    const armedTracks = mixer.getTracks().filter((track) => track.armed);
    for (let track of armedTracks) {
      track.recorder.startRecord();
    }
  };
  ui.onStop = () => {
    const armedTracks = mixer.getTracks().filter((track) => track.armed);
    for (let track of armedTracks) {
      track.recorder.stopRecord();
    }
  };

  // monitor

  const masterStream = masterChannel.getOutputStream();
  const masterNode = masterChannel.getOutputNode();
  monitorStream(masterStream, "Output", headerElement);

  const audio = new Audio();
  audio.srcObject = masterStream;
  audio.play();

  // devices / output device selector
  const devices = await AudioUtils.getAudioDevies();
  const audioOutputDevices = devices.audiooutput;

  console.log("Available Input Devices:");
  devices.audioinput.forEach((dev, i) => {
    console.log(i.toString(), "|", dev.label, "-", dev.deviceId);
  });

  console.log("Available Output Devices:");
  devices.audiooutput.forEach((dev, i) => {
    console.log(i.toString(), "|", dev.label, "-", dev.deviceId);
  });

  const device = audioOutputDevices[0];

  const deviceDropdown = new DropdownButton();
  deviceDropdown.options = audioOutputDevices.map((dev) => {
    return {
      name: dev.label,
      deviceId: dev.deviceId,
    };
  });
  deviceDropdown.value = {
    name: audioOutputDevices.default.label,
    deviceId: audioOutputDevices.default.deviceId,
  };

  const prefOutputDevice = Preferences.get("output-device");
  if (prefOutputDevice) {
    const dev = audioOutputDevices.find(
      (dev) => dev.deviceId == prefOutputDevice.deviceId
    );
    deviceDropdown.value = {
      name: dev.label,
      deviceId: dev.deviceId,
    };
    audio.setSinkId(dev.deviceId);
  }

  deviceDropdown.addEventListener("change", (e) => {
    console.log("Output to:", deviceDropdown.value.deviceId);
    audio.setSinkId(deviceDropdown.value.deviceId);
    Preferences.set("output-device", deviceDropdown.value);
  });

  controlsElement.appendChild(deviceDropdown);
}

function makeUi() {
  const controls = new PlaybackControls();

  const callbacks = {
    onStart() {},
    onStop() {},
    onPlay() {},
    onPause() {},
  };

  controlsElement.appendChild(controls);

  controls.addEventListener("play", (e) => {
    Timer.play();
    callbacks.onPlay();
  });
  controls.addEventListener("pause", (e) => {
    Timer.pause();
    callbacks.onPause();
  });
  controls.addEventListener("startrecord", (e) => {
    Timer.play();
    callbacks.onStart();
  });
  controls.addEventListener("stoprecord", (e) => {
    Timer.pause();
    callbacks.onStop();
  });

  return callbacks;
}

function enableDebugMode() {
  debug.innerHTML += "Test" + "\n";
  window.addEventListener("error", (e) => {
    debug.innerHTML += JSON.stringify(e) + "\n";
  });
  window.addEventListener("warn", (e) => {
    debug.innerHTML += JSON.stringify(e) + "\n";
  });
  const log = console.log;
  const error = console.error;
  console.error = (...strs) => {
    debug.innerHTML +=
      `<span style="color:indianred;">${strs.join(" ")}</span>` + "\n";
    error(...strs);
  };
  console.log = (...strs) => {
    debug.innerHTML += strs.join(" ") + "\n";
    log(...strs);
  };

  console.log("tset", AudioWorkletNode);
}

if (location.search.match("debug")) {
  enableDebugMode();
}

try {
  main();
} catch (err) {
  console.error("failed to initialise");
  console.error(err);
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js", {}).then(
    (registration) => {
      // Registration was successful
      console.log(
        "ServiceWorker registration successful with scope: ",
        registration.scope
      );
    },
    function (err) {
      // registration failed :(
      console.log("ServiceWorker registration failed: ", err);
    }
  );
}
