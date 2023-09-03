import uiConfig from 'ui/vite.config.cjs';
import { mergeConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default mergeConfig(uiConfig, {
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [solidPlugin()],
});
