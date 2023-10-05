import library from './services/LibraryLocation.worker.ts';
import { IndexEntryMessage, LibraryMessage, SystemInfo, TagMessage } from 'proto';
import { createSignal } from 'solid-js';

library.test();

export type Location = {
  host?: string;
  name: string;
  path: string;
  index: IndexEntryMessage[];
};

export const [location, setLocation] = createSignal<Location>({
  host: '',
  name: 'default',
  path: '',
  index: [],
});

export const [file, setFile] = createSignal<IndexEntryMessage>();

export const [libs, setLibs] = createSignal<LibraryMessage[]>([]);

export const [tags, setTags] = createSignal<TagMessage[]>([]);

export const [sysinfo, setSysInfo] = createSignal<SystemInfo>();

export class Library {}
