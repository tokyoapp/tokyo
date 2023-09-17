import path from 'node:path';
import { build, defineConfig } from 'vite';
import worker from 'vite-plugin-wrap-worker';
import solidPlugin from 'vite-plugin-solid';
import rust from './plugins/vite-rust.js';
const wasm = require('vite-plugin-wasm');

const config = defineConfig({
  root: path.resolve('src'),
  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [rust(), wasm.default(), worker(), solidPlugin()],
});

await build(config);
