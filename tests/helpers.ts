import type { Answer, Mode, Result } from '../src/types';

let n = 0;
/** Make an answer at a given local time, e.g. ans('w1', 'right', '2026-10-01T09:00'). */
export function ans(wordId: string, result: Result, localTime: string, mode: Mode = 'flashcard', device = 'd-test'): Answer {
  n++;
  return { id: `a-${String(n).padStart(5, '0')}`, wordId, result, mode, at: new Date(localTime).toISOString(), device };
}

/** n answers of the same result on consecutive minutes of a day. */
export function many(wordId: string, results: Result[], day = '2026-10-01'): Answer[] {
  return results.map((r, i) => ans(wordId, r, `${day}T09:${String(i).padStart(2, '0')}`));
}

export const R: Result = 'right';
export const W: Result = 'wrong';
