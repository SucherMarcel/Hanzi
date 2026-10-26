// Building a study session and moving through it.

import type { Level, Result, Word } from '../types';
import { statsOf, type WordStats } from './stats';

export type SessionFilter = Level | 'all';

export interface Session {
  filter: SessionFilter;
  /** Word IDs still to show; the first one is the current card. */
  queue: string[];
  /** Distinct words in this session. */
  total: number;
  /** Words answered "Got it" and not coming back this session. */
  finished: string[];
  right: number;
  wrong: number;
}

export const SESSION_SIZE = 20;

/** Order for an "all words" session: weakest first, mastered last. */
const LEVEL_ORDER: Level[] = ['struggling', 'learning', 'familiar', 'new', 'mastered'];

export function buildQueue(
  words: Word[],
  stats: Map<string, WordStats>,
  filter: SessionFilter,
  limit = SESSION_SIZE,
): string[] {
  const byLevel = new Map<Level, WordStats[]>();
  for (const w of words) {
    const s = statsOf(stats, w.id);
    if (filter !== 'all' && s.level !== filter) continue;
    const list = byLevel.get(s.level) ?? [];
    list.push(s);
    byLevel.set(s.level, list);
  }
  const queue: string[] = [];
  for (const level of LEVEL_ORDER) {
    const list = byLevel.get(level) ?? [];
    // Least recently reviewed first; new words keep their list order.
    if (level !== 'new') list.sort((a, b) => (a.lastReviewed ?? '').localeCompare(b.lastReviewed ?? ''));
    for (const s of list) queue.push(s.wordId);
  }
  // A single-level session shows all its words; the mixed session is capped.
  return filter === 'all' ? queue.slice(0, limit) : queue;
}

export function startSession(queue: string[], filter: SessionFilter): Session {
  return { filter, queue, total: queue.length, finished: [], right: 0, wrong: 0 };
}

/** How far back a wrong card is put: 3–5 cards later. */
export function reinsertGap(random: () => number): number {
  return 3 + Math.floor(random() * 3);
}

/** Grade the current card. A wrong card comes back later in the same session. */
export function gradeCurrent(session: Session, result: Result, random: () => number = Math.random): Session {
  const [current, ...rest] = session.queue;
  if (current === undefined) return session;
  if (result === 'right') {
    return { ...session, queue: rest, finished: [...session.finished, current], right: session.right + 1 };
  }
  const at = Math.min(reinsertGap(random), rest.length);
  const queue = [...rest.slice(0, at), current, ...rest.slice(at)];
  return { ...session, queue, wrong: session.wrong + 1 };
}

export function isDone(session: Session): boolean {
  return session.queue.length === 0;
}
