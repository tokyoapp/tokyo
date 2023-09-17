import { spawn } from 'node:child_process';
import { readFileSync, write, writeFile } from 'node:fs';
import { resolve, dirname, relative, join } from 'node:path';

function exec(exec: string, args: string[], options: { cwd: string }): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn(exec, args, {
      stdio: 'ignore',
      ...options,
    });

    child.stderr?.on('data', (data) => {
      reject(data);
    });

    child.on('close', (code) => {
      resolve(code);
    });
  });
}

const fileRegex = /\.rs$/;

export default function rust() {
  return {
    name: 'vite-plugin-rust',

    async transform(src, id) {
      if (fileRegex.test(id)) {
        const dist = 'node_modules/.rust';
        const dir = resolve(dirname(resolve(id)), '..');

        await exec('wasm-pack', ['build', '--target', 'web', '-d', dist], {
          cwd: dir,
        }).catch(console.error);

        const pkg = JSON.parse(readFileSync(resolve(dir, dist, 'package.json')).toString());
        const module = resolve(dir, dist, pkg.module);

        return {
          code: readFileSync(module)
            .toString()
            .replace('core_bg.wasm', join(dir, dist, 'core_bg.wasm')),
          map: null,
        };
      }
    },
  };
}
