import { IndexEntryMessage } from '@tokyo/proto';
import { setFile } from '../App.tsx';

export default async function open(item: IndexEntryMessage) {
  setFile(item);
}
