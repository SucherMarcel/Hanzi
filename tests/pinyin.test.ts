import { describe, expect, it } from 'vitest';
import { foldPinyin, splitPinyin, stripTones, toneOf } from '../src/logic/pinyin';

describe('pinyin', () => {
  it('reads tones', () => {
    expect(['mā', 'má', 'mǎ', 'mà', 'ma', 'nǚ', 'lǜ', 'Ài'].map(toneOf)).toEqual([1, 2, 3, 4, 5, 3, 4, 4]);
  });
  it('splits syllables and keeps punctuation', () => {
    expect(splitPinyin('Xiè xie nǐ!')).toEqual([
      { text: 'Xiè', tone: 4 }, { text: ' ' }, { text: 'xie', tone: 5 }, { text: ' ' }, { text: 'nǐ', tone: 3 }, { text: '!' },
    ]);
  });
  it('folds for search', () => {
    expect(stripTones('xiè xie')).toBe('xie xie');
    expect(foldPinyin('Nǚ ér')).toBe('nver');
    expect(foldPinyin("nǚ'ér")).toBe('nver');
  });
});
