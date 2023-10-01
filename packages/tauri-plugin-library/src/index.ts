import { invoke } from '@tauri-apps/api/tauri';

export async function list() {
  return await invoke('plugin:library|get_list');
}

export async function index(name: string) {
  return await invoke('plugin:library|get_index', {
    name,
  });
}

export async function system() {
  return await invoke('plugin:library|get_system', {});
}

export async function metadata(file: string) {
  return await invoke('plugin:library|get_metadata', {
    file,
  });
}
