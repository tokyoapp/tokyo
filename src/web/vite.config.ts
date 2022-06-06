import { defineConfig } from "vite";
import pkg from "./package.json";

declare module process {
  const NODE_ENV: "production" | "development";
}

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "static",
  mode: process.NODE_ENV,
  define: {
    __APP_VERSION__: pkg.version,
  },
  server: {
    open: "/index.html",
  },
  build: {
    outDir: "../../dist",
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
    },
  },
});
