import { IndexEntryMessage } from 'proto';
import { setFile } from '../App.tsx';

export default async function open(item: IndexEntryMessage) {
  setFile(item);
}
