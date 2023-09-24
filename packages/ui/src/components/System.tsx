import { sysinfo, location } from '../Library.ts';

export function SystemInfo() {
  return (
    <div class="p-4 pb-10 grid grid-cols-4 items-center justify-center justify-items-center">
      <div>{sysinfo()?.diskName}</div>
      <div>Total {Math.round(sysinfo()?.diskSize / 1000)} GB</div>
      <div>Available {Math.round(sysinfo()?.diskAvailable / 1000)} GB</div>
      <div>{location()?.index.length} Photos</div>
    </div>
  );
}
