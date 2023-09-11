import { mergeConfig, createServer } from 'vite';
import coreConfig from 'core/vite.config';

const wasm = require('vite-plugin-wasm');

const config = mergeConfig(coreConfig, {
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  root: 'src',
  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [wasm.default()],
});

const server = await createServer(config);
await server.listen();

server.printUrls();
