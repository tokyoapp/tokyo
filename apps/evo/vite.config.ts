import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import wrapWorker from "vite-plugin-wrap-worker";
import svgSprites from "svg-sprites/vite";
import path from "node:path";

export default defineConfig({
  publicDir: "static",
  server: {
    port: 3000,
  },
  // resolve: {
  //   alias: {
  //     "~": path.resolve("./"),
  //   },
  // },
  plugins: [solidPlugin(), wrapWorker(), svgSprites()],
});
