import { Entry, setFile } from '../Library.ts';

export default async function open(item: Entry) {
  setFile(item);
}
