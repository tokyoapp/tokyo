import { mergeConfig, createServer } from 'vite'
import uiConfig from 'ui/vite.config';
import solidPlugin from 'vite-plugin-solid';

const config = mergeConfig(uiConfig, {
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  root: "src",
  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [solidPlugin()],
});

const server = await createServer(config);
await server.listen()

server.printUrls()
