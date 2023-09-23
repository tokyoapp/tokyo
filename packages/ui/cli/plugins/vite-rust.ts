import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Plugin } from 'vite';

function exec(exec: string, args: string[], options: { cwd: string }): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn(exec, args, {
      stdio: 'ignore',
      ...options,
    });
    child.stderr?.on('data', reject);
    child.on('close', resolve);
  });
}

export default function rust(): Plugin {
  const entries = new Set<string>();

  const build = async (id: string) => {
    if (!entries.has(id)) entries.add(id);

    const dist = 'node_modules/.rust';
    const cwd = resolve(dirname(resolve(id)), '..');

    await exec('wasm-pack', ['build', '--target', 'web', '-d', dist], {
      cwd,
    }).catch(console.error);

    const pkg = JSON.parse(readFileSync(resolve(cwd, dist, 'package.json')).toString());
    const module = resolve(cwd, dist, pkg.module);

    return {
      code: readFileSync(module)
        .toString()
        .replace('core_bg.wasm', join(cwd, dist, 'core_bg.wasm')),
    };
  };

  return {
    name: 'vite-plugin-rust',

    config: () => ({
      server: {
        watch: {
          disableGlobbing: false,
        },
      },
    }),

    configureServer(server) {
      const dir = resolve(__dirname, '../../src/**/*.rs');
      server.watcher.add(dir);
      server.watcher.on('change', (path, stat) => {
        if (path.match('.rs')) {
          for (const id of entries) {
            build(id);
          }
        }
      });
    },

    async transform(src, id) {
      if (/\.rs$/.test(id)) {
        const { code } = await build(id);

        return {
          code: code,
          map: null,
        };
      }
    },
  };
}
