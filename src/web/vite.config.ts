import { defineConfig } from "vite";
import pkg from "./package.json";

declare module process {
  const NODE_ENV: "production" | "development";
}

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "static",
  mode: process.NODE_ENV,
  assetsInclude: ["node_modules/@ffmpeg/core/dist/ffmpeg-core.js"],
  define: {
    __APP_VERSION__: `"${pkg.version.toString()}"`,
    __IS_DEBUG__: process.NODE_ENV === "production" ? "false" : "true",
  },
  server: {
    open: "/",
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Opener-Policy-Report-Only": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Embedder-Policy-Report-Only": "require-corp",
    },
  },
  build: {
    outDir: "../../dist",
    target: "es2018",
  },
});
