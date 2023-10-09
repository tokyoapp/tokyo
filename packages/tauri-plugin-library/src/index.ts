import { invoke } from '@tauri-apps/api/tauri';

export async function locations(): Promise<
  {
    id: string;
    name: string;
    path: string;
    library: string;
  }[]
> {
  return await invoke('plugin:library|get_locations');
}

export async function index(name: string): Promise<
  {
    hash: string;
    name: string;
    path: string;
    create_date: string;
    rating: number;
    orientation: number;
    tags: Array<string>;
  }[]
> {
  return await invoke('plugin:library|get_index', {
    name,
  });
}

export async function system(): Promise<{
  disk_name: string;
  disk_size: number;
  disk_available: number;
}> {
  return await invoke('plugin:library|get_system', {});
}

export async function metadata(file: string): Promise<{
  hash: string;
  name: string;
  path: string;
  create_date: string;
  rating: number;
  orientation: number;
  tags: string[];
}> {
  return await invoke('plugin:library|get_metadata', {
    file,
  });
}
