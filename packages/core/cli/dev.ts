import path from 'node:path';
import { createServer, defineConfig } from 'vite';
import worker from 'vite-plugin-wrap-worker';
import solidPlugin from 'vite-plugin-solid';
const wasm = require('vite-plugin-wasm');

const config = defineConfig({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  root: path.resolve('src'),
  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [wasm.default(), worker(), solidPlugin()],
});

const server = await createServer(config);
await server.listen();

server.printUrls();
