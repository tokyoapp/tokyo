import { createServer, mergeConfig } from "vite";
import { config as sharedConfig } from "./vite-config.js";

const config = mergeConfig(sharedConfig, {
  clearScreen: false,
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    fs: {
      allow: ["../../../"],
    },
  },
});

const server = await createServer(config);
await server.listen();

server.printUrls();
