import { sysinfo, index } from '../Library.ts';
import { t } from 'tokyo-locales';

export function SystemInfo() {
  return (
    <div class="p-4 pb-10 grid grid-cols-4 items-center justify-center justify-items-center">
      <div>{sysinfo()?.diskName}</div>
      <div>{t('system_disk_total', [Math.round(sysinfo()?.diskSize / 1000)])}</div>
      <div>{t('system_disk_available', [Math.round(sysinfo()?.diskAvailable / 1000)])}</div>
      <div>{t('system_photo_count', [index.length])}</div>
    </div>
  );
}
