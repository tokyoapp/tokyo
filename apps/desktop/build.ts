import { mergeConfig, build } from 'vite';
import coreConfig from 'core/vite.config';

const config = mergeConfig(coreConfig, {
  root: 'src',
  envPrefix: ['VITE_', 'TAURI_'],
});

await build(config);
