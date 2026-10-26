import { describe, expect, it } from 'vitest';
import { computeStats, countByLevel, formatCount, intervalDays, levelFor, statsOf } from '../src/logic/stats';
import { ans, many, R, W } from './helpers';

describe('levelFor', () => {
  it('is New with no answers', () => expect(levelFor(0, 0, 0)).toBe('new'));
  it('is Struggling when the last answer was wrong', () => expect(levelFor(9, 1, 0, 'wrong')).toBe('struggling'));
  it('is Struggling under 50% right even after a right answer', () => expect(levelFor(2, 3, 1, 'right')).toBe('struggling'));
  it('is Learning with 1–2 in a row', () => {
    expect(levelFor(1, 0, 1, 'right')).toBe('learning');
    expect(levelFor(2, 1, 2, 'right')).toBe('learning');
  });
  it('is Familiar with 3–4 in a row', () => {
    expect(levelFor(3, 0, 3, 'right')).toBe('familiar');
    expect(levelFor(4, 2, 4, 'right')).toBe('familiar');
  });
  it('is Mastered with 5+ in a row and at least 80%', () => {
    expect(levelFor(5, 0, 5, 'right')).toBe('mastered');
    expect(levelFor(8, 2, 5, 'right')).toBe('mastered');
  });
  it('stays Familiar with 5+ in a row but under 80%', () => expect(levelFor(6, 2, 6, 'right')).toBe('familiar'));
});

describe('intervalDays', () => {
  it('follows the plan', () => {
    expect(intervalDays('struggling', 0)).toBe(1);
    expect(intervalDays('learning', 1)).toBe(1);
    expect(intervalDays('familiar', 3)).toBe(3);
    expect(intervalDays('familiar', 4)).toBe(7);
    expect(intervalDays('mastered', 5)).toBe(14);
    expect(intervalDays('mastered', 6)).toBe(21);
    expect(intervalDays('mastered', 9)).toBe(30);
  });
});

describe('computeStats', () => {
  it('counts answers, streak and level', () => {
    const s = statsOf(computeStats(many('w1', [W, R, R, R])), 'w1');
    expect(s).toMatchObject({ right: 3, wrong: 1, streak: 3, level: 'familiar', lastResult: 'right' });
  });

  it('a wrong answer drops a mastered word to Struggling', () => {
    const s = computeStats(many('w1', [R, R, R, R, R, R]));
    expect(statsOf(s, 'w1').level).toBe('mastered');
    const after = statsOf(computeStats([...many('w1', [R, R, R, R, R, R]), ans('w1', W, '2026-10-02T09:00')]), 'w1');
    expect(after.level).toBe('struggling');
    expect(after.streak).toBe(0);
  });

  it('replays answers in time order, whatever order they are stored in', () => {
    const list = many('w1', [R, R, W]);
    expect(statsOf(computeStats([...list].reverse()), 'w1').lastResult).toBe('wrong');
  });

  it('sets the next due day from the level', () => {
    const due = (results: ('right' | 'wrong')[]) => statsOf(computeStats(many('w1', results, '2026-10-01')), 'w1').nextDue;
    expect(due([W])).toBe('2026-10-02');
    expect(due([R])).toBe('2026-10-02');
    expect(due([R, R, R])).toBe('2026-10-04');
    expect(due([R, R, R, R])).toBe('2026-10-08');
    expect(due([R, R, R, R, R])).toBe('2026-10-15');
    expect(due([R, R, R, R, R, R, R])).toBe('2026-10-31');
  });

  it('quiz answers count half in totals but do not change the level', () => {
    const list = [ans('w1', R, '2026-10-01T09:00'), ans('w1', R, '2026-10-01T09:01', 'quiz-h2e'), ans('w1', W, '2026-10-01T09:02', 'quiz-e2h')];
    const s = statsOf(computeStats(list), 'w1');
    expect(s).toMatchObject({ right: 1.5, wrong: 0.5, flashRight: 1, flashWrong: 0, level: 'learning', streak: 1 });
  });

  it('a word answered only in the quiz stays New', () => {
    expect(statsOf(computeStats([ans('w1', R, '2026-10-01T09:00', 'quiz-h2p')]), 'w1').level).toBe('new');
  });

  it('counts words per level', () => {
    const stats = computeStats([...many('a', [R]), ...many('b', [W])]);
    expect(countByLevel(['a', 'b', 'c'], stats)).toEqual({ new: 1, struggling: 1, learning: 1, familiar: 0, mastered: 0 });
  });
});

describe('formatCount', () => {
  it('shows halves', () => {
    expect(formatCount(7)).toBe('7');
    expect(formatCount(7.5)).toBe('7½');
    expect(formatCount(0.5)).toBe('½');
    expect(formatCount(0)).toBe('0');
  });
});
