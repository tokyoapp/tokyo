import path from 'node:path';
import { defineConfig } from 'vite';
import worker from 'vite-plugin-wrap-worker';
import solidPlugin from 'vite-plugin-solid';
const wasm = require('vite-plugin-wasm');

export const config = defineConfig({
  root: path.resolve('src'),
  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [wasm.default(), worker(), solidPlugin()],
  css: {
    postcss: {
      plugins: [
        require('tailwindcss')({
          content: [path.resolve(__dirname, '../src/**/*.{js,ts,jsx,tsx}')],
          theme: {
            extend: {},
          },
          plugins: [require('@tailwindcss/container-queries')],
        }),
      ],
    },
    preprocessorOptions: {},
  },
});
