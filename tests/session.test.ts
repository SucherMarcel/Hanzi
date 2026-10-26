import { describe, expect, it } from 'vitest';
import { buildQueue, gradeCurrent, isDone, startSession } from '../src/logic/session';
import { computeStats } from '../src/logic/stats';
import type { Word } from '../src/types';
import { many, R, W } from './helpers';

const word = (id: string): Word => ({ id, hanzi: id, pinyin: 'a', meaning: id, topic: 'T', hsk: 1, example: { hanzi: '', pinyin: '', english: '' } });
const words = ['n1', 'n2', 's1', 'l1', 'm1'].map(word);
const stats = computeStats([...many('s1', [W]), ...many('l1', [R]), ...many('m1', [R, R, R, R, R])]);

describe('buildQueue', () => {
  it('puts struggling first and mastered last', () => {
    expect(buildQueue(words, stats, 'all')).toEqual(['s1', 'l1', 'n1', 'n2', 'm1']);
  });
  it('filters by level', () => {
    expect(buildQueue(words, stats, 'new')).toEqual(['n1', 'n2']);
    expect(buildQueue(words, stats, 'struggling')).toEqual(['s1']);
  });
  it('caps a mixed session', () => {
    expect(buildQueue(words, stats, 'all', 2)).toEqual(['s1', 'l1']);
  });
});

describe('gradeCurrent', () => {
  const noRandom = () => 0; // gap of 3
  it('removes a right card', () => {
    const s = gradeCurrent(startSession(['a', 'b'], 'all'), 'right');
    expect(s.queue).toEqual(['b']);
    expect(s.finished).toEqual(['a']);
  });
  it('puts a wrong card back 3–5 cards later', () => {
    const s = gradeCurrent(startSession(['a', 'b', 'c', 'd', 'e', 'f'], 'all'), 'wrong', noRandom);
    expect(s.queue).toEqual(['b', 'c', 'd', 'a', 'e', 'f']);
    const s5 = gradeCurrent(startSession(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 'all'), 'wrong', () => 0.99);
    expect(s5.queue).toEqual(['b', 'c', 'd', 'e', 'f', 'a', 'g']);
  });
  it('puts a wrong card at the end of a short queue', () => {
    const s = gradeCurrent(startSession(['a', 'b'], 'all'), 'wrong', noRandom);
    expect(s.queue).toEqual(['b', 'a']);
  });
  it('a session ends only when every card was got right', () => {
    let s = startSession(['a'], 'all');
    s = gradeCurrent(s, 'wrong', noRandom);
    expect(isDone(s)).toBe(false);
    expect(s.queue).toEqual(['a']);
    s = gradeCurrent(s, 'right');
    expect(isDone(s)).toBe(true);
    expect([s.right, s.wrong]).toEqual([1, 1]);
  });
});
