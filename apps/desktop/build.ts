import { mergeConfig, build } from 'vite'
import uiConfig from 'ui/vite.config';
import solidPlugin from 'vite-plugin-solid';

const config = mergeConfig(uiConfig, {
  root: "src",
  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [solidPlugin()],
});

await build(config)
