import type { IndexEntryMessage } from "tokyo-schema";
import { setFile } from "../App.jsx";

export default async function open(item: IndexEntryMessage) {
  setFile(item);
}
