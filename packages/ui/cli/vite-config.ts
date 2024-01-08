import path from 'node:path';
import autoprefixer from 'autoprefixer';
import tailwind from 'tailwindcss';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export const config = defineConfig({
	root: path.resolve('src'),
	build: {
		target: 'esnext',
		outDir: path.resolve('dist'),
	},
	envPrefix: ['VITE_', 'TAURI_'],
	plugins: [require('vite-plugin-wasm').default(), solidPlugin()],
	css: {
		postcss: {
			plugins: [
				autoprefixer(),
				tailwind({
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
