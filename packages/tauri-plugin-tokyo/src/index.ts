import { invoke } from '@tauri-apps/api/core';

export async function thumbnail(id: string): Promise<Uint8Array> {
  return await invoke('plugin:library|get_thumbnail', { id });
}

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

export async function createLocation(
  name: string,
  path: string
): Promise<{
  id: string;
  name: string;
  path: string;
  library: string;
}> {
  return await invoke('plugin:library|post_location', {
    name,
    path,
  });
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

export async function getImage(
  path: string,
  params: {
    exposure: number;
  }
): Promise<{
  width: number;
  height: number;
  data: Uint8Array;
}> {
  return await invoke('plugin:library|get_image', {
    path,
    exposure: params.exposure,
  });
}
