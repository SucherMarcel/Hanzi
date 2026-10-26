// Settings are stored one record per key; when two records exist for a key, the newest wins.

import type { Setting } from '../types';

export interface Settings {
  /** true: hanzi + pinyin on the front; false: hanzi only, pinyin on the back. */
  showPinyinOnFront: boolean;
  autoPlayAudio: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  showPinyinOnFront: true,
  autoPlayAudio: true,
};

/** Keep the newest record per key (ties broken by device ID so every device agrees). */
export function newestPerKey(records: Setting[]): Map<string, Setting> {
  const map = new Map<string, Setting>();
  for (const r of records) {
    const cur = map.get(r.key);
    if (!cur || r.updatedAt > cur.updatedAt || (r.updatedAt === cur.updatedAt && r.device > cur.device)) map.set(r.key, r);
  }
  return map;
}

export function resolveSettings(records: Setting[]): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  for (const [key, r] of newestPerKey(records)) {
    if (key in out && typeof r.value === typeof out[key as keyof Settings]) {
      (out as unknown as Record<string, unknown>)[key] = r.value;
    }
  }
  return out;
}
