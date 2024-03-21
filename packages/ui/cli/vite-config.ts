import path from "node:path";
import autoprefixer from "autoprefixer";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export const config = defineConfig({
  root: path.resolve("src"),
  build: {
    target: "esnext",
    outDir: path.resolve("dist"),
  },
  envPrefix: ["VITE_", "TAURI_"],
  plugins: [solidPlugin()],
  css: {
    postcss: {
      plugins: [autoprefixer(), tailwind()],
    },
    preprocessorOptions: {},
  },
});
