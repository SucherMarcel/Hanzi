// Memory levels and review dates, calculated from the answer history.
// Nothing here is stored: the history is the source of truth.

import type { Answer, Level, Result } from '../types';
import { addDays, localDay, type Day } from './dates';

/** Quiz answers count this much in the ✓/✗ totals (flashcards count 1). */
export const QUIZ_WEIGHT = 0.5;

export interface WordStats {
  wordId: string;
  level: Level;
  /** Weighted totals shown on cards: flashcards count 1, quiz answers ½. */
  right: number;
  wrong: number;
  /** Flashcard-only counts, used for levels. */
  flashRight: number;
  flashWrong: number;
  /** Flashcard answers right in a row. */
  streak: number;
  lastResult?: Result;
  /** ISO time of the last answer of any kind. */
  lastReviewed?: string;
  /** Day the word is next due (only once it has a flashcard answer). */
  nextDue?: Day;
}

export function emptyStats(wordId: string): WordStats {
  return { wordId, level: 'new', right: 0, wrong: 0, flashRight: 0, flashWrong: 0, streak: 0 };
}

export function levelFor(flashRight: number, flashWrong: number, streak: number, last?: Result): Level {
  const total = flashRight + flashWrong;
  if (total === 0) return 'new';
  const pct = flashRight / total;
  if (last === 'wrong' || pct < 0.5) return 'struggling';
  if (streak >= 5 && pct >= 0.8) return 'mastered';
  if (streak >= 3) return 'familiar';
  return 'learning';
}

/** Days until the next review, given the level right after an answer. */
export function intervalDays(level: Level, streak: number): number {
  switch (level) {
    case 'new':
    case 'struggling':
    case 'learning':
      return 1;
    case 'familiar':
      return streak >= 4 ? 7 : 3;
    case 'mastered':
      return streak >= 7 ? 30 : streak === 6 ? 21 : 14;
  }
}

/** Sort answers by time, then by ID, so every device replays them in the same order. */
export function byTime(a: Answer, b: Answer): number {
  return a.at < b.at ? -1 : a.at > b.at ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Apply one answer to a word's stats (returns a new object). */
export function applyAnswer(s: WordStats, a: Answer): WordStats {
  const right = a.result === 'right';
  const next = { ...s, lastReviewed: a.at };
  if (a.mode !== 'flashcard') {
    if (right) next.right += QUIZ_WEIGHT;
    else next.wrong += QUIZ_WEIGHT;
    return next;
  }
  if (right) {
    next.right += 1;
    next.flashRight += 1;
    next.streak += 1;
  } else {
    next.wrong += 1;
    next.flashWrong += 1;
    next.streak = 0;
  }
  next.lastResult = a.result;
  next.level = levelFor(next.flashRight, next.flashWrong, next.streak, next.lastResult);
  next.nextDue = addDays(localDay(a.at), intervalDays(next.level, next.streak));
  return next;
}

/** Stats for every word that has at least one answer. */
export function computeStats(answers: Answer[]): Map<string, WordStats> {
  const map = new Map<string, WordStats>();
  for (const a of [...answers].sort(byTime)) {
    map.set(a.wordId, applyAnswer(map.get(a.wordId) ?? emptyStats(a.wordId), a));
  }
  return map;
}

export function statsOf(map: Map<string, WordStats>, wordId: string): WordStats {
  return map.get(wordId) ?? emptyStats(wordId);
}

export function countByLevel(wordIds: string[], map: Map<string, WordStats>): Record<Level, number> {
  const counts: Record<Level, number> = { new: 0, struggling: 0, learning: 0, familiar: 0, mastered: 0 };
  for (const id of wordIds) counts[statsOf(map, id).level]++;
  return counts;
}

/** Format a weighted count: 7 → "7", 7.5 → "7½". */
export function formatCount(n: number): string {
  const whole = Math.floor(n);
  return n - whole >= 0.5 ? `${whole > 0 ? whole : ''}½` : String(whole);
}
