import { mergeConfig, createServer } from 'vite';
import coreConfig from 'core/vite.config';

const config = mergeConfig(coreConfig, {
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  root: 'src',
  envPrefix: ['VITE_', 'TAURI_'],
});

const server = await createServer(config);
await server.listen();

server.printUrls();
