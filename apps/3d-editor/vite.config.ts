import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import wrapWorker from "vite-plugin-wrap-worker";
import svgSprites from "svg-sprites/vite";
import Package from "./package.json";

const envVars = {
  __PACKAGE__: {
    version: Package.version,
    name: Package.name,
    description: Package.description,
  },
};

export default defineConfig({
  base: "",
  publicDir: "static",
  server: {
    port: 3000,
  },
  define: envVars,
  plugins: [solidPlugin(), wrapWorker(), svgSprites()],
});
