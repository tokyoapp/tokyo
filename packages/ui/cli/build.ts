import { visualizer } from "rollup-plugin-visualizer";
import { build, mergeConfig } from "vite";
import { config as sharedConfig } from "./vite-config.js";

const config = mergeConfig(sharedConfig, {
  plugins: [
    visualizer({
      emitFile: true,
      filename: "stats.html",
    }),
  ],
});

await build(config);
