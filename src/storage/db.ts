// On-device storage in IndexedDB. Every answer is written as soon as it is given.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Answer, CustomWord, Setting } from '../types';
import { newId } from './ids';

export interface ToneAnswer {
  id: string;
  char: string;
  syllable: string;
  tone: number;
  picked: number;
  at: string;
  device: string;
}

interface HanziDB extends DBSchema {
  answers: { key: string; value: Answer; indexes: { wordId: string } };
  toneAnswers: { key: string; value: ToneAnswer };
  customWords: { key: string; value: CustomWord };
  settings: { key: string; value: Setting };
  meta: { key: string; value: { key: string; value: string } };
}

let dbPromise: Promise<IDBPDatabase<HanziDB>> | null = null;

export function db(): Promise<IDBPDatabase<HanziDB>> {
  dbPromise ??= openDB<HanziDB>('hanzi', 1, {
    upgrade(d) {
      d.createObjectStore('answers', { keyPath: 'id' }).createIndex('wordId', 'wordId');
      d.createObjectStore('toneAnswers', { keyPath: 'id' });
      d.createObjectStore('customWords', { keyPath: 'id' });
      d.createObjectStore('settings', { keyPath: 'key' });
      d.createObjectStore('meta', { keyPath: 'key' });
    },
  });
  return dbPromise;
}

/** A random ID made once per device (per browser), used to tag records. */
export async function deviceId(): Promise<string> {
  const d = await db();
  const row = await d.get('meta', 'deviceId');
  if (row) return row.value;
  const id = newId('d');
  await d.put('meta', { key: 'deviceId', value: id });
  return id;
}

/** Ask the browser not to clear our data when space runs low. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    return false;
  }
}

export async function allAnswers(): Promise<Answer[]> {
  return (await db()).getAll('answers');
}

export async function saveAnswer(answer: Answer): Promise<void> {
  // The transaction resolves only once the record is safely written.
  const tx = (await db()).transaction('answers', 'readwrite', { durability: 'strict' });
  await Promise.all([tx.store.put(answer), tx.done]);
}

export async function allSettings(): Promise<Setting[]> {
  return (await db()).getAll('settings');
}

export async function saveSetting(setting: Setting): Promise<void> {
  await (await db()).put('settings', setting);
}

export async function allCustomWords(): Promise<CustomWord[]> {
  return (await db()).getAll('customWords');
}
