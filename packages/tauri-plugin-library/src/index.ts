import { invoke } from '@tauri-apps/api/tauri';

export async function list() {
  return await invoke('plugin:library|list');
}
