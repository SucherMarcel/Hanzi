// App-wide state: words, answer history, settings. Stats are derived from the history.

import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import hsk1 from '../data/hsk1.json';
import { computeStats, type WordStats } from './logic/stats';
import { DEFAULT_SETTINGS, resolveSettings, type Settings } from './logic/settings';
import { allAnswers, allCustomWords, allSettings, deviceId, requestPersistentStorage, saveAnswer, saveSetting } from './storage/db';
import { newId } from './storage/ids';
import type { Answer, Mode, Result, Setting, Word } from './types';

interface AppState {
  ready: boolean;
  error: string | null;
  words: Word[];
  wordById: Map<string, Word>;
  answers: Answer[];
  stats: Map<string, WordStats>;
  settings: Settings;
  record(wordId: string, result: Result, mode: Mode): Promise<void>;
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

const BUILT_IN = hsk1.words as Word[];

export function AppProvider({ children }: { children: ComponentChildren }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [settingRows, setSettingRows] = useState<Setting[]>([]);
  const [customWords, setCustomWords] = useState<Word[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [dev, a, s, c] = await Promise.all([deviceId(), allAnswers(), allSettings(), allCustomWords()]);
        setDevice(dev);
        setAnswers(a);
        setSettingRows(s);
        setCustomWords(c.filter((w) => !w.deleted));
        requestPersistentStorage();
      } catch (e) {
        setError('This browser could not open its storage, so progress cannot be saved. Private/incognito windows can cause this.');
        console.error(e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const words = useMemo(() => [...BUILT_IN, ...customWords], [customWords]);
  const wordById = useMemo(() => new Map(words.map((w) => [w.id, w])), [words]);
  const stats = useMemo(() => computeStats(answers), [answers]);
  const settings = useMemo(() => (settingRows.length ? resolveSettings(settingRows) : DEFAULT_SETTINGS), [settingRows]);

  const record = useCallback(
    async (wordId: string, result: Result, mode: Mode) => {
      const answer: Answer = { id: newId('a'), wordId, result, mode, at: new Date().toISOString(), device };
      setAnswers((prev) => [...prev, answer]);
      try {
        await saveAnswer(answer);
      } catch (e) {
        console.error(e);
        setError('Your last answer could not be saved on this device. Try reloading the app.');
      }
    },
    [device],
  );

  const setSetting = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      const row: Setting = { key, value, updatedAt: new Date().toISOString(), device };
      setSettingRows((prev) => [...prev.filter((r) => r.key !== key), row]);
      try {
        await saveSetting(row);
      } catch (e) {
        console.error(e);
      }
    },
    [device],
  );

  const value: AppState = { ready, error, words, wordById, answers, stats, settings, record, setSetting };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
