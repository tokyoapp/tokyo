import path from 'node:path';
import { build, defineConfig } from 'vite';
import worker from 'vite-plugin-wrap-worker';
import solidPlugin from 'vite-plugin-solid';
const wasm = require('vite-plugin-wasm');

const config = defineConfig({
  root: path.resolve('src'),
  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [wasm.default(), worker(), solidPlugin()],
});

await build(config);
