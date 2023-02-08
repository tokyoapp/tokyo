// gyro
import Gyro, { Component } from "./Gyro";
// components
import "ui/components/layout/Group"; // all the layout comps
import "ui/components/menubar/Menubar";
import "ui/components/settings/Settings";

window.addEventListener("contextmenu", (e) => e.preventDefault());

export default function (modules) {
  // register all components for selction
  for (let mod of modules) {
    const module = mod as unknown as Component;
    Gyro.registerComponent(module);
  }

  // debug switch
  Gyro.log("Gyro loaded");
  Gyro.log("Loading user...");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then(
      (registration) => {
        // Registration was successful
        console.log("ServiceWorker registration successful with scope: ", registration.scope);
      },
      function (err) {
        // registration failed :(
        console.log("ServiceWorker registration failed: ", err);
      }
    );
  }
}
