import { mergeConfig, build } from 'vite';
import coreConfig from 'core/vite.config';

const wasm = require('vite-plugin-wasm');

const config = mergeConfig(coreConfig, {
  root: 'src',
  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [wasm.default()],
});

await build(config);
