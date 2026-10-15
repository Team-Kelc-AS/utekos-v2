import { VARGNATT_FULL_IMAGE } from './vargnattFullImage';

// These selected studio originals are displayed whole inside a desktop 4:5 frame.
const framedSources = new Set([
  VARGNATT_FULL_IMAGE.url,
  ...['Blue', 'Black'].flatMap(color => [1, 2, 3, 4].map(number =>
    `/images/kunnskap/Soveposejakke_${color}${number}.webp`
  )),
]);

export function usesDesktopPortraitFrame(url: string) {
  return framedSources.has(url);
}
