// Shared data types. The saved format is documented in docs/PLAN.md.

export interface Example {
  hanzi: string;
  pinyin: string;
  english: string;
}

export interface Word {
  id: string;
  hanzi: string;
  /** Syllables separated by spaces, with tone marks, e.g. "xiè xie". */
  pinyin: string;
  meaning: string;
  topic: string;
  hsk: number;
  example: Example;
}

export interface CustomWord extends Word {
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export type Result = 'right' | 'wrong';
export type Mode = 'flashcard' | 'quiz-h2e' | 'quiz-e2h' | 'quiz-h2p';

/** One answer. Append-only: never edited or deleted. */
export interface Answer {
  id: string;
  wordId: string;
  result: Result;
  mode: Mode;
  /** ISO timestamp (UTC). */
  at: string;
  device: string;
}

export interface Setting<T = unknown> {
  key: string;
  value: T;
  updatedAt: string;
  device: string;
}

export type Level = 'new' | 'struggling' | 'learning' | 'familiar' | 'mastered';

export const LEVELS: Level[] = ['new', 'struggling', 'learning', 'familiar', 'mastered'];
