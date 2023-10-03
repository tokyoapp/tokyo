import * as Comlink from 'comlink';

async function createLocationWorker(offset: number) {
  const worker = new Worker(new URL('./workers/RemoteLibrary.js', import.meta.url), {
    type: 'module',
  });
  const wrappedWorker = Comlink.wrap<typeof import('./workers/RemoteLibrary.js').default>(worker);

  await wrappedWorker.inc(offset);
  console.log(await wrappedWorker.counter);

  return wrappedWorker;
}

console.log('init');

await createLocationWorker(5);
await createLocationWorker(12);
