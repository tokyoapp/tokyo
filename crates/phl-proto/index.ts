import fs from 'fs';

export { proto as default } from './src/generated/library.js';

import { proto } from './src/generated/library.js';
const { Library } = proto;

function create(obj: any) {
  let data: any | undefined;
  let err: Error | undefined;

  const lib = Library.create(obj);

  const validation = Library.verify(lib);
  if (validation) {
    err = new Error(validation);
  }

  if (!validation) {
    data = Library.encode(lib).finish();
  }

  return [data, err] as const;
}

const [data, err] = create({
  name: 'default',
  path: '/',
});

console.log(data);
