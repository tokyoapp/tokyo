import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import path from "node:path";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "~": path.resolve("./"),
    },
  },
  plugins: [solidPlugin()],
});
