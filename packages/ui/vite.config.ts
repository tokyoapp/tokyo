import path from "node:path";
import tailwind from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import terminal from "vite-plugin-terminal";

export const config = defineConfig({
  root: path.resolve("src"),
  build: {
    target: "esnext",
    outDir: path.resolve("dist"),
  },
  envPrefix: ["VITE_", "TAURI_"],
  plugins: [
    import.meta.env.DEV &&
      terminal({
        console: "terminal",
        output: ["terminal", "console"],
      }),
    solidPlugin(),
    tailwind(),
  ],
});
